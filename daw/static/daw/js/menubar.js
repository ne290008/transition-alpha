const add = (x) => {
  return (x) && parseInt(x);
}

/*再生ボタンと停止ボタン*/
$('#play').click(function() {
  if(play_flg == 0){
    $('.play-btn').css('display','none');
    $('.stop-btn').css('display','block');
  }else{
    $('.play-btn').css('display','block');
    $('.stop-btn').css('display','none');
  }
})

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
})

//BPM
$('.bpm_value').html(bpm);
$('.bpm_slider').on('input change', function() {
  bpm = $(this).val();
  $('.bpm_value').html(bpm);
});
