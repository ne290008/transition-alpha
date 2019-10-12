$(function(){
  $('.mute').on('click', function(event){
    event.preventDefault();
    $(this).toggleClass('active');
    var mute_index = $(".mute").index(this);
    if(mute_flg[mute_index] == 0){
      mute_flg[mute_index] = 1;
    }else{
      mute_flg[mute_index] = 0;
    }
    console.log(mute_flg[mute_index]);
  });
});

//knob
window.inputKnobsOptions={
  fgcolor:"#333",
  bgcolor:"#ccc",
  knobDiameter:"48"
}