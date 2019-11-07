var chord_stroke_A = [

];
var chord_stroke_B = [

];
var chord_stroke_C = [

];

var drum_pattern_A = [

];
var drum_pattern_B = [

];
var drum_pattern_C = [

];

jQuery(function($){
  $(".start_next-btn").click(function(){
    if($('.start_next-btn').index(this) == 2){
      console.log(artist);
      console.log(key);
      console.log(rhythm_pattern);
      // テスト用 本来は第一引数はartistになる
      generateChordProgression("hoge", key.split("/")[0]);
    }
  });
  $(".Progress_number").click(function(){
    if($(".Progress_number").index(this) == 3 && $(this).hasClass("is-active")){
      console.log(artist);
      console.log(key);
      console.log(rhythm_pattern);
    }
  });
});

// HACK: 例外処理のしやすさからPromiseオブジェクトにすべき
function generateChordProgression(artist, key) {
  $.ajax({
    type: 'POST',
    url: '/api/v1/chordprog/',
    dataType: 'json',
    headers: {
      'X-CSRFToken': token
    },
    data: {
      'artist': artist,
      'key': key,
    },
  })
    .then(response => {
      console.log('succeed');
      console.log(response);
      chord_prog = response.chord_progression;
    })
    .catch(error => {
      console.log('failed');
      console.log(error);
    });
}
