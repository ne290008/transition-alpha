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
    save(MIDI_Melody, song_name, artist, key, rhythm_pattern, chord_prog, bpm).then(response => {
      // ここで成功時の処理
      // console.log('succeed');
      // console.log(response);
      alert("保存しました。");
      // console.log(song_name);
      $(".save-window").css("display", "none");
    })
    .catch(error => {
      // ここで失敗時の処理
      // console.log('failed');
      // console.log(error);
      if(error.responseJSON.non_field_errors.includes("作成者とプロジェクト名でユニークになっていなければいけません。")) {
        // 同名のプロジェクトが存在する場合
        if(confirm('"' + song_name + '"' + 'はすでに存在します。\n上書き保存しますか？')) {
          getProjectIdByProjectName(song_name).then(id => {
            project_id = id;
            // 以下の処理はデータ更新時とほぼ同じ
            overwrite(project_id, MIDI_Melody, song_name, artist, key, rhythm_pattern, chord_prog, bpm).then(response => {
              // ここで成功時の処理
              // console.log('succeed');
              // console.log(response);
              alert("保存しました。");
              $(".save-window").css("display", "none");
            })
            .catch(error => {
              // ここで失敗時の処理
              // console.log('failed');
              // console.log(error);
              alert("保存できませんでした。");
            });
          });
        }
      } else {
        alert("保存できませんでした。");
      }
    });
  }else{
    alert("ファイル名を入力してください。");
  }
});
$(".ow_save-btn").click(function(){
  var song_name = document.getElementById("song_name_input").value;
  if(song_name.length > 0){
    overwrite(project_id, MIDI_Melody, song_name, artist, key, rhythm_pattern, chord_prog, bpm).then(response => {
      // ここで成功時の処理
      // console.log('succeed');
      // console.log(response);
      alert("保存しました。");
      $(".save-window").css("display", "none");
    })
    .catch(error => {
      // ここで失敗時の処理
      // console.log('failed');
      // console.log(error);
      alert("保存できませんでした。");
    });
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

$("#back").click(function(){
  if(confirm('保存していない内容は破棄されますが、本当にプロジェクト選択画面に戻りますか。')){
    sessionStorage.clear();
    location.href = index;
  }else{
    return false;
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
function overwrite(id, melody_data, project_name, artist, key, rhythm_pattern, chord_prog, bpm) {
  return new Promise((resolve, reject) => {
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
      .then(response => resolve(response))
      .catch(error => reject(error));
  });
}

// 新規作成用
function save(melody_data, project_name, artist, key, rhythm_pattern, chord_prog, bpm) {
  return new Promise((resolve, reject) => {
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
      .then(response => resolve(response))
      .catch(error => reject(error));
  });
}

// 新規作成画面での上書き保存用 プロジェクト名からidを取得する
function getProjectIdByProjectName(name) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'GET',
      url: '/api/v1/projects/?project_name=' + name,
      dataType: 'json',
    })
      .then(response => resolve(response[0].id))
      .catch(error => reject(error));
  });
}
