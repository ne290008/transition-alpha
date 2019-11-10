const add = (x) => {
  return (x) && parseInt(x);
}
/*saveボタン・ウィンドウ*/
$(function() { //Enterを押しても送信されないようにする。
  $(document).on("keypress", "input:not(.allow_submit)", function(event) {
    return event.which !== 13;
  });
});
var save_flg = 0;
$("#save").click(function(){
  $(".save-window").css("display", "block");
});
$(".times").click(function(){
  $(".save-window").css("display", "none");
});
if(project_name) {
  document.getElementById('song_name_input').value = project_name;
}
$(".new_save-btn").click(function(){
  var song_name = document.getElementById("song_name_input").value;
  if(song_name.length > 0){
    save(MIDI_Melody, song_name, artist, key, rhythm_pattern, chord_prog, bpm);
    alert("保存しました。");
    console.log(song_name);
    $(".save-window").css("display", "none");
  }else{
    alert("ファイル名を入力してください。");
  }
});
$(".ow_save-btn").click(function(){
  var song_name = document.getElementById("song_name_input").value;
  if(song_name.length > 0){
    overwrite(project_id, MIDI_Melody, song_name, artist, key, rhythm_pattern, chord_prog, bpm);
    alert("保存しました。");
    console.log(song_name);
    $(".save-window").css("display", "none");
  }else{
    alert("ファイル名を入力してください。");
  }
});

/*helpボタン*/
var help_flg = 0;
$('#help').click(function() {
  if(help_flg == 0){
    $('#help').css('background','#ffff7f');
    help_flg = 1;
  }else{
    $('#help').css('background','#8fdfda');
    help_flg = 0;
  }
});

/*再生ボタンと停止ボタン*/
$('#play').click(function() {
  if(play_flg == 0){
    $('.play-btn').css('display','none');
    $('.stop-btn').css('display','block');
  }else{
    $('.play-btn').css('display','block');
    $('.stop-btn').css('display','none');
  }
});

/*作曲情報バー*/
$('.artist').html(artist);
$('.key').html(key);

//BPM
$('.bpm_value').html(bpm);
$('.bpm_slider').on('input change', function() {
  bpm = $(this).val();
  $('.bpm_value').html(bpm);
});

// データ更新用
// HACK: 例外処理のしやすさからPromiseオブジェクトにすべき
function overwrite(id, melody_data, project_name, artist, key, rhythm_pattern, chord_prog, bpm) {
  $.ajax({
    type: 'PUT',
    url: '/api/v1/projects/' + id + '/',
    dataType: 'json',
    headers: {
      'X-CSRFToken': token
    },
    data: {
      'melody_data': JSON.stringify(melody_data),
      'project_name': project_name,
      'artist': artist,
      'key': key,
      'rhythm_pattern': rhythm_pattern,
      'chord_prog': chord_prog,
      'bpm': bpm,
    },
  })
    .then(response => {
      console.log('succeed');
      console.log(response);
    })
    .catch(error => {
      console.log('failed');
      console.log(error);
    });
}

// 新規作成用
// HACK: 例外処理のしやすさからPromiseオブジェクトにすべき
function save(melody_data, project_name, artist, key, rhythm_pattern, chord_prog, bpm) {
  $.ajax({
    type: 'POST',
    url: '/api/v1/projects/',
    dataType: 'json',
    headers: {
      'X-CSRFToken': token
    },
    data: {
      'melody_data': JSON.stringify(melody_data),
      'project_name': project_name,
      'artist': artist,
      'key': key,
      'rhythm_pattern': rhythm_pattern,
      'chord_prog': chord_prog,
      'bpm': bpm,
    },
  })
    .then(response => {
      console.log('succeed');
      console.log(response);
    })
    .catch(error => {
      console.log('failed');
      console.log(error);
    });
}
