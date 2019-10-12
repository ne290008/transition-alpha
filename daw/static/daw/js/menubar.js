const add = (x) => {
  return (x) && parseInt(x);
}

/*再生ボタンと停止ボタン*/
var start = true;
document.getElementById("play").onclick = function() {
  if(start == true){
    document.getElementById("play").innerHTML = "□";
    start = false;
  }else{
    document.getElementById("play").innerHTML = "▷";
    start = true;
  }
};

/*helpボタン*/
var help = true;
document.getElementById("help").onclick = function() {
  if(help == true){
    document.getElementById("numbpm").style.backgroundColor = "#FFFF8A";
    help = false;
  }else{
    document.getElementById("numbpm").style.backgroundColor = "white";
    help = true
  }
};