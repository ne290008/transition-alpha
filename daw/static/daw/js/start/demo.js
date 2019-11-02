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
