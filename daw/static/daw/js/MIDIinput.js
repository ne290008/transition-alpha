jQuery(function($){
  //MIDIinput_grids生成 ?191009
  var MIDI_Mscale = 72; //音階数 重すぎるのでヤマハ式のC1〜B6まで(72)
  var notes_measure = 128; //notesの列数 (デフォルト>> 16小節 * 16拍 = 256) 重い場合はここを調整してください(コード自動生成等の都合上、ここをいじるだけだとエラーを吐きます)
  var Mscale_Do = ["ド", "ド#", "レ", "レ#", "ミ", "ファ", "ファ#", "ソ", "ソ#", "ラ", "ラ#", "シ"];
  var Mscale_C = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  var Keys = {"C":0,"C#":1,"Db":1,"D":2,"D#":3,"Eb":3,"E":4,"F":5,"F#":6,"Gb":6,"G":7,"G#":8,"Ab":8,"A":9,"A#":10,"Bb":10,"B":11};
  var chord_list =[ //C3のインデックス基準 テンションコードは別で付与 逆順で表示しているため、+-が逆
    [0, 0, 0], //Major
    [0, 1, 0], //Minor
    [0, 2, 0], //sus2
    [0, -1, 0], //sus4
    [0, 0, -1], //aug
    [0, 1, 1] //dim
  ]
  var Tensions = [
    2, //6th
    3, //7th
    4, //M7th
    6, //add9thb
    7 //add9th
  ];
  Mscale_Do.reverse(); //逆から表示するために反転している
  Mscale_C.reverse(); //同上
  //小節
  for(var h = 1; h-1 < notes_measure/16; h++){
    $(".Measure_grid").append("<div class=\"measures\"><p>"+h);
  }
  //音階
  for(var i = 0; i < MIDI_Mscale; i++){
    var Mscale_index = Math.ceil((MIDI_Mscale-i) / 12); //国際式はi-12 ヤマハ式はi-24
    $(".Mscale_grid").append("<div class=\"Mscale_notes\"><p>" + Mscale_C[i%12] + Mscale_index);
  }
  //入力部分
  for(var j = 0; j < notes_measure; j++){
    $(".note_grid").append("<div class=\"MIDI_notes\">");
    for(var k = 0; k < MIDI_Mscale; k++){
      if(j % 16 == 0){
        $(".MIDI_notes").eq(j).append("<div class=\"notes measure_first_notes\">");
      }else if(j % 4 == 0){
        $(".MIDI_notes").eq(j).append("<div class=\"notes measure_beat_notes\">");
      }else{
        $(".MIDI_notes").eq(j).append("<div class=\"notes\">");
      }
    }
  }

  //Measure_grid, note_gridの横幅の設定（場合によってはwindow_resizeも追記）
  var MIDIinput_right_width = $(".main").width() - $(".inst_bar").width() - 100;
  $(".Measure_grid").css("width", MIDIinput_right_width);
  $(".note_grid").css("width", MIDIinput_right_width);
  //ウィンドウサイズをリサイズした時
  $(window).resize(function(){
    var MIDIinput_right_width = $(".main").width() - $(".inst_bar").width() - 100;
    $(".Measure_grid").css("width", MIDIinput_right_width);
    $(".note_grid").css("width", MIDIinput_right_width);
  });

  //スクロール連動 小節, 音階
  $(".note_grid").scroll(function() {
    $(".Measure_grid").scrollLeft(
      $(".note_grid").scrollLeft()
    );
    $(".Mscale_grid").scrollTop(
      $(".note_grid").scrollTop()
    );
  });

  //notes縦横可変
  var measure_width = 800; //measureの最低幅 ページ読み込み時の初期サイズは1600px
  var note_width = 50; //notesの最低幅 ページ読み込み時の初期サイズは100px
  var note_height = 20; //notesの最低高さ ページ読み込み時の初期サイズは40px

  $(".Mscale_notes").css({"width":note_width*2, "height":note_height*2});
  $(".notes").css({"width":note_width*2, "height":note_height*2});

  $(".width_scale_bar").on("input",function(){
    var measure_resize_width = measure_width * ($(".width_scale_bar").val() / 50);
    $(".measures").css("width", measure_resize_width);
    var note_resize_width = note_width * ($(".width_scale_bar").val() / 50);
    $(".notes").css("width", note_resize_width);
  });
  $(".height_scale_bar").on("input",function(){
    var note_resize_height = note_height * ($(".height_scale_bar").val() / 50);
    $(".Mscale_notes").css("height", note_resize_height);
    $(".notes").css("height", note_resize_height);
  });

  //MIDI色切り替え, 音声出力
  var isMouseDown = false;
  var polysynth = new Tone.PolySynth().toMaster(); //Melody用
  var plucksynth = new Tone.PluckSynth().toMaster(); //Bass用
  /*Samplerについての注意事項
  初期状態ではXHRでローカルファイルを持ってくることはセキュリティ上できないため、
  ローカルで起動する場合はWebブラウザの設定が必要。
  Firefoxならstrict_origin_policy = True(既定値) → Falseにする。(非推奨)*/
  var Piano_sampler = new Tone.Sampler({
    "C4" : "/static/daw/audio/Piano_C4.wav",
  }, {attack:0.05 ,release:1.0}).toMaster();
  var Drum_sampler = new Tone.Sampler({
    "C1" : "/static/daw/audio/Drum/Kick_C1.wav",
    "C#1" : "/static/daw/audio/Drum/Snare_Cs1.wav",
    "D1" : "/static/daw/audio/Drum/Snare_D1.wav",
    "E1" : "/static/daw/audio/Drum/Snare_E1.wav",
    "F1" : "/static/daw/audio/Drum/LowTom_F1.wav",
    "F#1" : "/static/daw/audio/Drum/CH_Fs1.wav",
    "G1" : "/static/daw/audio/Drum/LowTom_G1.wav",
    "G#1" : "/static/daw/audio/Drum/CHF_Gs1.wav",
    "A1" : "/static/daw/audio/Drum/MidTom_A1.wav",
    "A#1" : "/static/daw/audio/Drum/OH_As1.wav",
    "B1" : "/static/daw/audio/Drum/MidTom_B1.wav",
    "C2" : "/static/daw/audio/Drum/HighTom_C2.wav",
    "C#2" : "/static/daw/audio/Drum/CrashLeft_Cs2.wav",
    "D2" : "/static/daw/audio/Drum/HighTom_D2.wav",
    "D#2" : "/static/daw/audio/Drum/Ride_Ds2.wav",
    "E2" : "/static/daw/audio/Drum/OH_E2.wav"
  }).toMaster();
  function addMelody(time, note) {
    polysynth.triggerAttackRelease(note.note, note.duration, time);
  }
  function addChord(time, note) {
    polysynth.triggerAttackRelease(note.note, note.duration, time);
  }
  function addBass(time, note) {
    plucksynth.triggerAttackRelease(note, '16n', time);
  }
  function addDrum(time, note) {
    Drum_sampler.triggerAttackRelease(note, '1n', time);
  }
  // var MIDI_Melody = []; //小節:拍:拍内小節, 音名 保存に使用
  // CHANGED: menubar.js内でも参照したいため、グローバル変数として定義
  for(x=0; x<notes_measure/16; x++){ //
    for(y=0; y<4; y++){
      for(z=0; z<4; z++){
        MIDI_Melody.push({"time":x+":"+y+":"+z, "note":[""], "duration":"16n"});
      }
    }
  }
  var ml_line = 0;
  var ml_column = 0;
  var first_column = 0;
  var column_count = 0;

  $(".notes").mousedown(function(event) {
    isMouseDown = true;
    var note_name = $('.notes').index(this) % 12;
    var pitch =  Math.ceil((MIDI_Mscale-$('.notes').index(this)%MIDI_Mscale) / 12);
    var MIDI_note = Mscale_C[note_name] + pitch;
    var measure_count = $(this).parent().index();
    if(event.shiftKey == false){
      if($(this).hasClass('highlighted') == false){
        polysynth.triggerAttackRelease(Mscale_C[note_name]+pitch, '16n');

        if(MIDI_Melody[measure_count].note == ""){
          MIDI_Melody[measure_count].note.splice(0, 1, MIDI_note);
          console.log("新規追加");
          console.log(MIDI_Melody);
        }else{
          MIDI_Melody[measure_count].note.push(MIDI_note);
          console.log("追加");
          console.log(MIDI_Melody);
        }
      }else{
        var highlight_index = $.inArray(MIDI_note, MIDI_Melody[measure_count].note);
        MIDI_Melody[measure_count].note.splice(highlight_index, 1);
        console.log("削除");
        console.log(MIDI_Melody);
      }
      $(this).toggleClass("highlighted");
    }else{
      //2個以上つなげる際の処理
      ml_line = $('.notes').index(this) % MIDI_Mscale;
      if($(this).hasClass('ml_highlighted') == false){
        polysynth.triggerAttackRelease(Mscale_C[note_name]+pitch, '16n');
      }
      $(this).toggleClass("ml_highlighted");
      first_column = $(this).parent().index();
    }
    return false; // prevent text selection
  })
  .mouseover(function(event) {
    if (isMouseDown) {
      var note_name = $('.notes').index(this) % 12;
      var pitch =  Math.ceil((MIDI_Mscale-$('.notes').index(this)%MIDI_Mscale) / 12);
      var MIDI_note = Mscale_C[note_name] + pitch;
      var measure_count = $(this).parent().index();
      if(event.shiftKey == false){
        if($(this).hasClass('highlighted') == false){
          polysynth.triggerAttackRelease(Mscale_C[note_name]+pitch, '16n');

          if(MIDI_Melody[measure_count].note == ""){
            MIDI_Melody[measure_count].note.splice(0, 1, MIDI_note);
            console.log("新規追加");
            console.log(MIDI_Melody);
          }else{
            MIDI_Melody[measure_count].note.push(MIDI_note);
            console.log("追加");
            console.log(MIDI_Melody);
          }
        }else{
          var highlight_index = $.inArray(MIDI_note, MIDI_Melody[measure_count].note);
          MIDI_Melody[measure_count].note.splice(highlight_index, 1);
          console.log("削除");
          console.log(MIDI_Melody);
        }
        $(this).toggleClass("highlighted");
      }else{
        //2個以上つなげる際の処理
        if($(this).hasClass('ml_highlighted') == false){

        }else{

        }
        ml_column = $(this).parent().index();
        if(ml_column > first_column+column_count){
          $(".notes").eq(MIDI_Mscale*ml_column+ml_line).toggleClass("ml_highlighted");
          column_count += 1;
        }
      }
    }
  })
  .bind("selectstart", function () {
    return false; // prevent text selection in IE
  });
  $(document).mouseup(function () {
    isMouseDown = false;
    if(column_count > 0){ //2個以上つなげる
      var note_name = ml_line % 12;
      var pitch =  Math.ceil((MIDI_Mscale-ml_line) / 12);
      var MIDI_note = Mscale_C[note_name] + pitch;
      if(MIDI_Melody[first_column].note == ""){
        MIDI_Melody[first_column].note.splice(0, 1, MIDI_note);
        MIDI_Melody[first_column].duration = (16-column_count) + "n";
      }else{
        MIDI_Melody[first_column].note.push(MIDI_note);
        MIDI_Melody[first_column].duration = (16-column_count) + "n";
      }
    }
    //console.log(MIDI_Melody[first_column]);
    //変数の初期化
    ml_column = 0;
    column_count = 0;
  })

  //受け渡された情報からメロディを表示する 読み込みに使用
  //Polysynthは和音に対応 三次元配列で記述可
  /*
  var test_Melody = [
    {"time":"0:0:0", "note":["A5"], "duration":"16n"},
    {"time":"0:0:1", "note":[""], "duration":"16n"},
    {"time":"0:0:2", "note":["F5"], "duration":"16n"},
    {"time":"0:0:3", "note":[], "duration":"16n"},
    {"time":"0:1:0", "note":["G5"], "duration":"16n"},
    {"time":"0:1:1", "note":[], "duration":"16n"},
    {"time":"0:1:2", "note":["A5"], "duration":"16n"},
    {"time":"0:1:3", "note":[""], "duration":"16n"},
    {"time":"0:2:0", "note":[], "duration":"16n"},
    {"time":"0:2:1", "note":[""], "duration":"16n"},
    {"time":"0:2:2", "note":["F6"], "duration":"16n"},
    {"time":"0:2:3", "note":[], "duration":"16n"},
    {"time":"0:3:0", "note":["E6"], "duration":"16n"},
    {"time":"0:3:1", "note":[], "duration":"16n"},
    {"time":"0:3:2", "note":["F6"], "duration":"16n"},
    {"time":"0:3:3", "note":[], "duration":"16n"},
    {"time":"1:0:0", "note":["E6"], "duration":"16n"},
    {"time":"1:0:1", "note":[""], "duration":"16n"},
    {"time":"1:0:2", "note":["F6"], "duration":"16n"},
    {"time":"1:0:3", "note":[], "duration":"16n"},
    {"time":"1:1:0", "note":["E6"], "duration":"8n"},
    {"time":"1:1:1", "note":[], "duration":"16n"},
    {"time":"1:1:2", "note":[""], "duration":"16n"},
    {"time":"1:1:3", "note":[""], "duration":"16n"},
    {"time":"1:2:0", "note":["C6"], "duration":"16n"},
    {"time":"1:2:1", "note":[""], "duration":"16n"},
    {"time":"1:2:2", "note":["D6"], "duration":"16n"},
    {"time":"1:2:3", "note":[], "duration":"16n"},
    {"time":"1:3:0", "note":["A5"], "duration":"16n"},
    {"time":"1:3:1", "note":[], "duration":"16n"},
    {"time":"1:3:2", "note":["G5"], "duration":"16n"},
    {"time":"1:3:3", "note":[""], "duration":"16n"},
    {"time":"2:0:0", "note":["F5"], "duration":"16n"},
    {"time":"2:0:1", "note":[""], "duration":"16n"},
    {"time":"2:0:2", "note":[""], "duration":"16n"},
    {"time":"2:0:3", "note":[], "duration":"16n"},
    {"time":"2:1:0", "note":["G5"], "duration":"16n"},
    {"time":"2:1:1", "note":[], "duration":"16n"},
    {"time":"2:1:2", "note":[""], "duration":"16n"},
    {"time":"2:1:3", "note":[""], "duration":"16n"},
    {"time":"2:2:0", "note":["F5"], "duration":"16n"},
    {"time":"2:2:1", "note":[""], "duration":"16n"},
    {"time":"2:2:2", "note":[""], "duration":"16n"},
    {"time":"2:2:3", "note":[], "duration":"16n"},
    {"time":"2:3:0", "note":["G5"], "duration":"16n"},
    {"time":"2:3:1", "note":[], "duration":"16n"},
    {"time":"2:3:2", "note":["D5"], "duration":"16n"},
    {"time":"2:3:3", "note":[], "duration":"16n"},
    {"time":"3:0:0", "note":[""], "duration":"16n"},
    {"time":"3:0:1", "note":[""], "duration":"16n"},
    {"time":"3:0:2", "note":["D5"], "duration":"16n"},
    {"time":"3:0:3", "note":[], "duration":"16n"},
    {"time":"3:1:0", "note":["A5"], "duration":"16n"},
    {"time":"3:1:1", "note":[], "duration":"16n"},
    {"time":"3:1:2", "note":[""], "duration":"16n"},
    {"time":"3:1:3", "note":[""], "duration":"16n"},
    {"time":"3:2:0", "note":["G5"], "duration":"16n"},
    {"time":"3:2:1", "note":[""], "duration":"16n"},
    {"time":"3:2:2", "note":[""], "duration":"16n"},
    {"time":"3:2:3", "note":[], "duration":"16n"},
    {"time":"3:3:0", "note":["F5"], "duration":"16n"},
    {"time":"3:3:1", "note":[], "duration":"16n"},
    {"time":"3:3:2", "note":["G5"], "duration":"16n"},
    {"time":"3:3:3", "note":[], "duration":"16n"},
    {"time":"4:0:0", "note":["A5"], "duration":"16n"},
    {"time":"4:0:1", "note":[""], "duration":"16n"},
    {"time":"4:0:2", "note":[""], "duration":"16n"},
    {"time":"4:0:3", "note":[], "duration":"16n"},
    {"time":"4:1:0", "note":["G5"], "duration":"16n"},
    {"time":"4:1:1", "note":[], "duration":"16n"},
    {"time":"4:1:2", "note":["F5"], "duration":"16n"},
    {"time":"4:1:3", "note":[""], "duration":"16n"},
    {"time":"4:2:0", "note":[], "duration":"16n"},
    {"time":"4:2:1", "note":[""], "duration":"16n"},
    {"time":"4:2:2", "note":[""], "duration":"16n"},
    {"time":"4:2:3", "note":[], "duration":"16n"},
    {"time":"4:3:0", "note":["C6"], "duration":"16n"},
    {"time":"4:3:1", "note":[], "duration":"16n"},
    {"time":"4:3:2", "note":[""], "duration":"16n"},
    {"time":"4:3:3", "note":[], "duration":"16n"},
    {"time":"5:0:0", "note":[""], "duration":"16n"},
    {"time":"5:0:1", "note":[""], "duration":"16n"},
    {"time":"5:0:2", "note":["G5"], "duration":"16n"},
    {"time":"5:0:3", "note":[], "duration":"16n"},
    {"time":"5:1:0", "note":[""], "duration":"16n"},
    {"time":"5:1:1", "note":[], "duration":"16n"},
    {"time":"5:1:2", "note":["A5"], "duration":"16n"},
    {"time":"5:1:3", "note":[""], "duration":"16n"},
    {"time":"5:2:0", "note":["A#5"], "duration":"16n"},
    {"time":"5:2:1", "note":[""], "duration":"16n"},
    {"time":"5:2:2", "note":["A5"], "duration":"16n"},
    {"time":"5:2:3", "note":[], "duration":"16n"},
    {"time":"5:3:0", "note":["G5"], "duration":"16n"},
    {"time":"5:3:1", "note":[], "duration":"16n"},
    {"time":"5:3:2", "note":[""], "duration":"16n"},
    {"time":"5:3:3", "note":[], "duration":"16n"},
    {"time":"6:0:0", "note":["A5"], "duration":"16n"},
    {"time":"6:0:1", "note":[""], "duration":"16n"},
    {"time":"6:0:2", "note":[""], "duration":"16n"},
    {"time":"6:0:3", "note":[], "duration":"16n"},
    {"time":"6:1:0", "note":["G5"], "duration":"16n"},
    {"time":"6:1:1", "note":[], "duration":"16n"},
    {"time":"6:1:2", "note":["C6"], "duration":"16n"},
    {"time":"6:1:3", "note":[""], "duration":"16n"},
    {"time":"6:2:0", "note":["F5"], "duration":"16n"},
    {"time":"6:2:1", "note":[""], "duration":"16n"},
    {"time":"6:2:2", "note":[""], "duration":"16n"},
    {"time":"6:2:3", "note":[], "duration":"16n"},
    {"time":"6:3:0", "note":["G5"], "duration":"16n"},
    {"time":"6:3:1", "note":[], "duration":"16n"},
    {"time":"6:3:2", "note":[""], "duration":"16n"},
    {"time":"6:3:3", "note":[], "duration":"16n"},
    {"time":"7:0:0", "note":["F5"], "duration":"16n"},
    {"time":"7:0:1", "note":[""], "duration":"16n"},
    {"time":"7:0:2", "note":[""], "duration":"16n"},
    {"time":"7:0:3", "note":[], "duration":"16n"},
    {"time":"7:1:0", "note":["G5"], "duration":"16n"},
    {"time":"7:1:1", "note":[], "duration":"16n"},
    {"time":"7:1:2", "note":[""], "duration":"16n"},
    {"time":"7:1:3", "note":[""], "duration":"16n"},
    {"time":"7:2:0", "note":["A5"], "duration":"16n"},
    {"time":"7:2:1", "note":[""], "duration":"16n"},
    {"time":"7:2:2", "note":[""], "duration":"16n"},
    {"time":"7:2:3", "note":[], "duration":"16n"},
    {"time":"7:3:0", "note":["F5"], "duration":"16n"},
    {"time":"7:3:1", "note":[], "duration":"16n"},
    {"time":"7:3:2", "note":[""], "duration":"16n"},
    {"time":"7:3:3", "note":[], "duration":"16n"}
  ];*/
  var Mscale_number = {"C":11, "C#":10, "D":9, "D#":8, "E":7, "F":6, "F#":5, "G":4, "G#":3, "A":2, "A#":1, "B":0}; //逆順
  for(y=0; y<test_Melody.length; y++){
    if(test_Melody[y].note.length > 0 && test_Melody[y].note[0] != ""){
      for(z=0; z<test_Melody[y].note.length; z++){
        if(MIDI_Melody[y].note == ""){ //音情報
          MIDI_Melody[y].note.splice(0, 1, test_Melody[y].note[0]);
        }else{
          MIDI_Melody[y].note.push(test_Melody[y].note[z]);
        }
        var pitch = test_Melody[y].note[z].slice(-1);
        if(test_Melody[y].note[z].length == 3){ //C#3
          var note_name = test_Melody[y].note[z].slice(0, 2);
        }else{
          var note_name = test_Melody[y].note[z].slice(0, 1);
        }
        $(".notes").eq( //highlighted
          Mscale_number[note_name] + (6-pitch)*12 + y*MIDI_Mscale
        ).addClass("highlighted");
      }
    }
  }
  console.log("保存データ読み込み");
  console.log(MIDI_Melody);

  //コード(文字列からの生成)
  //受け渡されるデータ(コードストローク、ドラムパターン)
  var rhythm_pattern = "A"; //A,B,Cのいずれか
  var test_chord2_original = "Dm Am Bb F"; //Chainerからの出力

  if(rhythm_pattern == "A"){
    var chord_stroke = [ //CMaj基準
      {"time":"0:0:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"0:0:1", "note":[""], "duration":"16n"},
      {"time":"0:0:2", "note":[], "duration":"16n"},
      {"time":"0:0:3", "note":[], "duration":"16n"},
      {"time":"0:1:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"0:1:1", "note":[], "duration":"16n"},
      {"time":"0:1:2", "note":[47, 43, 40], "duration":"8n"},
      {"time":"0:1:3", "note":[""], "duration":"16n"},
      {"time":"0:2:0", "note":[""], "duration":"16n"},
      {"time":"0:2:1", "note":[""], "duration":"16n"},
      {"time":"0:2:2", "note":[47, 43, 40], "duration":"16n"},
      {"time":"0:2:3", "note":[""], "duration":"16n"},
      {"time":"0:3:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"0:3:1", "note":[""], "duration":"16n"},
      {"time":"0:3:2", "note":[], "duration":"16n"},
      {"time":"0:3:3", "note":[""], "duration":"16n"},
      {"time":"1:0:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"1:0:1", "note":[""], "duration":"16n"},
      {"time":"1:0:2", "note":[], "duration":"16n"},
      {"time":"1:0:3", "note":[], "duration":"16n"},
      {"time":"1:1:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"1:1:1", "note":[], "duration":"16n"},
      {"time":"1:1:2", "note":[47, 43, 40], "duration":"8n"},
      {"time":"1:1:3", "note":[""], "duration":"16n"},
      {"time":"1:2:0", "note":[""], "duration":"16n"},
      {"time":"1:2:1", "note":[""], "duration":"16n"},
      {"time":"1:2:2", "note":[47, 43, 40], "duration":"16n"},
      {"time":"1:2:3", "note":[""], "duration":"16n"},
      {"time":"1:3:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"1:3:1", "note":[""], "duration":"16n"},
      {"time":"1:3:2", "note":[], "duration":"16n"},
      {"time":"1:3:3", "note":[""], "duration":"16n"},
      {"time":"2:0:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"2:0:1", "note":[""], "duration":"16n"},
      {"time":"2:0:2", "note":[], "duration":"16n"},
      {"time":"2:0:3", "note":[], "duration":"16n"},
      {"time":"2:1:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"2:1:1", "note":[], "duration":"16n"},
      {"time":"2:1:2", "note":[47, 43, 40], "duration":"8n"},
      {"time":"2:1:3", "note":[""], "duration":"16n"},
      {"time":"2:2:0", "note":[""], "duration":"16n"},
      {"time":"2:2:1", "note":[""], "duration":"16n"},
      {"time":"2:2:2", "note":[47, 43, 40], "duration":"16n"},
      {"time":"2:2:3", "note":[""], "duration":"16n"},
      {"time":"2:3:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"2:3:1", "note":[""], "duration":"16n"},
      {"time":"2:3:2", "note":[], "duration":"16n"},
      {"time":"2:3:3", "note":[""], "duration":"16n"},
      {"time":"3:0:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"3:0:1", "note":[""], "duration":"16n"},
      {"time":"3:0:2", "note":[], "duration":"16n"},
      {"time":"3:0:3", "note":[], "duration":"16n"},
      {"time":"3:1:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"3:1:1", "note":[], "duration":"16n"},
      {"time":"3:1:2", "note":[47, 43, 40], "duration":"8n"},
      {"time":"3:1:3", "note":[""], "duration":"16n"},
      {"time":"3:2:0", "note":[""], "duration":"16n"},
      {"time":"3:2:1", "note":[""], "duration":"16n"},
      {"time":"3:2:2", "note":[47, 43, 40], "duration":"16n"},
      {"time":"3:2:3", "note":[""], "duration":"16n"},
      {"time":"3:3:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"3:3:1", "note":[""], "duration":"16n"},
      {"time":"3:3:2", "note":[], "duration":"16n"},
      {"time":"3:3:3", "note":[""], "duration":"16n"},
      {"time":"4:0:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"4:0:1", "note":[""], "duration":"16n"},
      {"time":"4:0:2", "note":[], "duration":"16n"},
      {"time":"4:0:3", "note":[], "duration":"16n"},
      {"time":"4:1:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"4:1:1", "note":[], "duration":"16n"},
      {"time":"4:1:2", "note":[47, 43, 40], "duration":"8n"},
      {"time":"4:1:3", "note":[""], "duration":"16n"},
      {"time":"4:2:0", "note":[""], "duration":"16n"},
      {"time":"4:2:1", "note":[""], "duration":"16n"},
      {"time":"4:2:2", "note":[47, 43, 40], "duration":"16n"},
      {"time":"4:2:3", "note":[""], "duration":"16n"},
      {"time":"4:3:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"4:3:1", "note":[""], "duration":"16n"},
      {"time":"4:3:2", "note":[], "duration":"16n"},
      {"time":"4:3:3", "note":[""], "duration":"16n"},
      {"time":"5:0:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"5:0:1", "note":[""], "duration":"16n"},
      {"time":"5:0:2", "note":[], "duration":"16n"},
      {"time":"5:0:3", "note":[], "duration":"16n"},
      {"time":"5:1:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"5:1:1", "note":[], "duration":"16n"},
      {"time":"5:1:2", "note":[47, 43, 40], "duration":"16n"},
      {"time":"5:1:3", "note":[""], "duration":"16n"},
      {"time":"5:2:0", "note":[""], "duration":"16n"},
      {"time":"5:2:1", "note":[""], "duration":"16n"},
      {"time":"5:2:2", "note":[47, 43, 40], "duration":"8n"},
      {"time":"5:2:3", "note":[""], "duration":"16n"},
      {"time":"5:3:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"5:3:1", "note":[""], "duration":"16n"},
      {"time":"5:3:2", "note":[], "duration":"16n"},
      {"time":"5:3:3", "note":[""], "duration":"16n"},
      {"time":"6:0:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"6:0:1", "note":[""], "duration":"16n"},
      {"time":"6:0:2", "note":[], "duration":"16n"},
      {"time":"6:0:3", "note":[], "duration":"16n"},
      {"time":"6:1:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"6:1:1", "note":[], "duration":"16n"},
      {"time":"6:1:2", "note":[47, 43, 40], "duration":"8n"},
      {"time":"6:1:3", "note":[""], "duration":"16n"},
      {"time":"6:2:0", "note":[""], "duration":"16n"},
      {"time":"6:2:1", "note":[""], "duration":"16n"},
      {"time":"6:2:2", "note":[47, 43, 40], "duration":"16n"},
      {"time":"6:2:3", "note":[""], "duration":"16n"},
      {"time":"6:3:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"6:3:1", "note":[""], "duration":"16n"},
      {"time":"6:3:2", "note":[], "duration":"16n"},
      {"time":"6:3:3", "note":[""], "duration":"16n"},
      {"time":"7:0:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"7:0:1", "note":[""], "duration":"16n"},
      {"time":"7:0:2", "note":[], "duration":"16n"},
      {"time":"7:0:3", "note":[], "duration":"16n"},
      {"time":"7:1:0", "note":[47, 43, 40], "duration":"16n"},
      {"time":"7:1:1", "note":[], "duration":"16n"},
      {"time":"7:1:2", "note":[47, 43, 40], "duration":"8n"},
      {"time":"7:1:3", "note":[""], "duration":"16n"},
      {"time":"7:2:0", "note":[""], "duration":"16n"},
      {"time":"7:2:1", "note":[""], "duration":"16n"},
      {"time":"7:2:2", "note":[47, 43, 40], "duration":"16n"},
      {"time":"7:2:3", "note":[""], "duration":"16n"},
      {"time":"7:3:0", "note":[47, 43, 40], "duration":"8n"},
      {"time":"7:3:1", "note":[""], "duration":"16n"},
      {"time":"7:3:2", "note":[], "duration":"16n"},
      {"time":"7:3:3", "note":[""], "duration":"16n"}
    ];
  }else if(rhythm_pattern == "B"){

  }else{

  }

  var test_chord2 = test_chord2_original.split(" ");
  var bassline = [];
  var key = [];
  var chord = [];
  var tension = [];
  var MIDI_chord = [];
  var cc_index = 0;
  for(var x=0; x<notes_measure/16; x++){
    if(test_chord2[x%4].indexOf("/") >= 0){
      bassline.push(test_chord2[x%4].slice(test_chord2[x%4].indexOf("/")+1));
    }else if(test_chord2[x%4].indexOf("#") == 1 || test_chord2[x%4].indexOf("b") == 1){
      bassline.push(test_chord2[x%4].slice(0, 2));
    }else{
      bassline.push(test_chord2[x%4].slice(0, 1));
    }

    if(test_chord2[x%4].indexOf("#") == 1 || test_chord2[x%4].indexOf("b") == 1){
      key.push(test_chord2[x%4].slice(0, 2));
    }else{
      key.push(test_chord2[x%4].slice(0, 1));
    }

    if(test_chord2[x%4].indexOf("dim") >= 0){
      chord.push(chord_list[5]);
    }else if(test_chord2[x%4].indexOf("aug") >= 0){
      chord.push(chord_list[4]);
    }else if(test_chord2[x%4].indexOf("sus4") >= 0){
      chord.push(chord_list[3]);
    }else if(test_chord2[x%4].indexOf("sus2") >= 0){
      chord.push(chord_list[2]);
    }else if(test_chord2[x%4].indexOf("m") >= 0){
      chord.push(chord_list[1]);
    }else{
      chord.push(chord_list[0]);
    }

    if(test_chord2[x%4].indexOf("add9b") >= 0){
      tension.push(Tensions[3]);
    }else if(test_chord2[x%4].indexOf("add9") >= 0){
      tension.push(Tensions[4]);
    }else if(test_chord2[x%4].indexOf("M7") >= 0){
      tension.push(Tensions[2]);
    }else if(test_chord2[x%4].indexOf("7") >= 0){
      tension.push(Tensions[1]);
    }else if(test_chord2[x%4].indexOf("6") >= 0){
      tension.push(Tensions[0]);
    }else{
      tension.push(0);
    }

    for(var y=0; y<16; y++){
      if(chord_stroke[x*16+y].note.length > 0 && chord_stroke[x*16+y].note[0] != ""){
        MIDI_chord.push(chord_stroke[x*16+y]);
        for(var z=0; z<3; z++){
          MIDI_chord[cc_index].note[z] -= Keys[key[x]];
          MIDI_chord[cc_index].note[z] += chord[x][z];
        }
        if(tension[x] != 0){
          MIDI_chord[cc_index].note.push(MIDI_chord[cc_index].note[2] - tension[x]);
        }
        for(var aa=0; aa<MIDI_chord[cc_index].note.length; aa++){
          var note_name = MIDI_chord[cc_index].note[aa] % 12;
          var pitch =  Math.ceil((MIDI_Mscale-MIDI_chord[cc_index].note[aa]%MIDI_Mscale) / 12);
          var MIDI_note = Mscale_C[note_name] + pitch;
          MIDI_chord[cc_index].note.splice(aa, 1, MIDI_note);
        }
        cc_index += 1;
      }
    }
  }
  //console.log(MIDI_chord);

  //ベース(コードからの自動生成)
  /*2拍に1回のペースでルート音を演奏。(C2〜B2)
  分数コードの場合は、該当する音を演奏。*/
  var MIDI_bass = [];
  for(x=0; x<notes_measure/16; x++){ //
    for(y=0; y<4; y++){
      for(z=0; z<4; z++){
        if(z%2 == 0){
          MIDI_bass.push([x+":"+y+":"+z, bassline[x]+2]);
        }
      }
    }
  }
  //console.log(MIDI_bass);

  //ドラム生成
  var test_drum = [
    ["0:0:0", ["C1", "G#1", "C#2"]],
    ["0:0:1", [""]],
    ["0:0:2", ["G#1"]],
    ["0:0:3", [""]],
    ["0:1:0", ["G#1"]],
    ["0:1:1", [""]],
    ["0:1:2", ["C1", "G#1"]],
    ["0:1:3", [""]],
    ["0:2:0", ["G#1"]],
    ["0:2:1", [""]],
    ["0:2:2", ["G#1"]],
    ["0:2:3", [""]],
    ["0:3:0", ["C1", "A#1"]],
    ["0:3:1", [""]],
    ["0:3:2", ["G#1"]],
    ["0:3:3", [""]],
    ["1:0:0", ["C1", "G#1", "C#2"]],
    ["1:0:1", [""]],
    ["1:0:2", ["G#1"]],
    ["1:0:3", [""]],
    ["1:1:0", ["G#1"]],
    ["1:1:1", [""]],
    ["1:1:2", ["C1", "G#1"]],
    ["1:1:3", [""]],
    ["1:2:0", ["G#1"]],
    ["1:2:1", [""]],
    ["1:2:2", ["G#1"]],
    ["1:2:3", [""]],
    ["1:3:0", ["C1", "A#1"]],
    ["1:3:1", [""]],
    ["1:3:2", ["G#1"]],
    ["1:3:3", [""]],
    ["2:0:0", ["C1", "G#1", "C#2"]],
    ["2:0:1", [""]],
    ["2:0:2", ["G#1"]],
    ["2:0:3", [""]],
    ["2:1:0", ["G#1"]],
    ["2:1:1", [""]],
    ["2:1:2", ["C1", "G#1"]],
    ["2:1:3", [""]],
    ["2:2:0", ["G#1"]],
    ["2:2:1", [""]],
    ["2:2:2", ["G#1"]],
    ["2:2:3", [""]],
    ["2:3:0", ["C1", "A#1"]],
    ["2:3:1", [""]],
    ["2:3:2", ["G#1"]],
    ["2:3:3", [""]],
    ["3:0:0", ["C1", "G#1", "C#2"]],
    ["3:0:1", [""]],
    ["3:0:2", ["G#1"]],
    ["3:0:3", [""]],
    ["3:1:0", ["G#1"]],
    ["3:1:1", [""]],
    ["3:1:2", ["C1", "G#1"]],
    ["3:1:3", [""]],
    ["3:2:0", ["G#1"]],
    ["3:2:1", [""]],
    ["3:2:2", ["G#1"]],
    ["3:2:3", [""]],
    ["3:3:0", ["C1", "A#1"]],
    ["3:3:1", [""]],
    ["3:3:2", ["G#1"]],
    ["3:3:3", [""]],
    ["4:0:0", ["C1", "G#1", "C#2"]],
    ["4:0:1", [""]],
    ["4:0:2", ["G#1"]],
    ["4:0:3", [""]],
    ["4:1:0", ["G#1"]],
    ["4:1:1", [""]],
    ["4:1:2", ["C1", "G#1"]],
    ["4:1:3", [""]],
    ["4:2:0", ["G#1"]],
    ["4:2:1", [""]],
    ["4:2:2", ["G#1"]],
    ["4:2:3", [""]],
    ["4:3:0", ["C1", "A#1"]],
    ["4:3:1", [""]],
    ["4:3:2", ["G#1"]],
    ["4:3:3", [""]],
    ["5:0:0", ["C1", "G#1", "C#2"]],
    ["5:0:1", [""]],
    ["5:0:2", ["G#1"]],
    ["5:0:3", [""]],
    ["5:1:0", ["G#1"]],
    ["5:1:1", [""]],
    ["5:1:2", ["C1", "G#1"]],
    ["5:1:3", [""]],
    ["5:2:0", ["G#1"]],
    ["5:2:1", [""]],
    ["5:2:2", ["G#1"]],
    ["5:2:3", [""]],
    ["5:3:0", ["C1", "A#1"]],
    ["5:3:1", [""]],
    ["5:3:2", ["G#1"]],
    ["5:3:3", [""]],
    ["6:0:0", ["C1", "G#1", "C#2"]],
    ["6:0:1", [""]],
    ["6:0:2", ["G#1"]],
    ["6:0:3", [""]],
    ["6:1:0", ["G#1"]],
    ["6:1:1", [""]],
    ["6:1:2", ["C1", "G#1"]],
    ["6:1:3", [""]],
    ["6:2:0", ["G#1"]],
    ["6:2:1", [""]],
    ["6:2:2", ["G#1"]],
    ["6:2:3", [""]],
    ["6:3:0", ["C1", "A#1"]],
    ["6:3:1", [""]],
    ["6:3:2", ["G#1"]],
    ["6:3:3", [""]],
    ["7:0:0", ["C1", "G#1", "C#2"]],
    ["7:0:1", [""]],
    ["7:0:2", ["G#1"]],
    ["7:0:3", [""]],
    ["7:1:0", ["G#1"]],
    ["7:1:1", [""]],
    ["7:1:2", ["C1", "G#1"]],
    ["7:1:3", [""]],
    ["7:2:0", ["G#1"]],
    ["7:2:1", [""]],
    ["7:2:2", ["G#1"]],
    ["7:2:3", [""]],
    ["7:3:0", ["C1", "A#1"]],
    ["7:3:1", [""]],
    ["7:3:2", ["G#1"]],
    ["7:3:3", [""]]
  ];

  //再生処理
  $("#play").click(function(){
    Tone.Transport.bpm.value = bpm; //bpm
    if(play_flg == 0){
      var play_MIDI_Melody = []; //再生用に無駄な情報を省いたもの
      var play_MIDI_Drum =[];
      for(z=0; z<test_drum.length; z++){ //本来はz<notes_measure
        if(MIDI_Melody[z].note.length > 0 && MIDI_Melody[z].note[0] != ""){
          play_MIDI_Melody.push(MIDI_Melody[z]);
        }
        if(test_drum[z][1].length > 0 && test_drum[z][1][0] != ""){
          play_MIDI_Drum.push(test_drum[z]);
        }
      }
      if(mute_flg[0] == 0){
        var Melody = new Tone.Part(addMelody, play_MIDI_Melody).start();
      }
      if(mute_flg[1] == 0){
        var Chord = new Tone.Part(addChord, MIDI_chord).start();
      }
      if(mute_flg[2] == 0){
        var Bass = new Tone.Part(addBass, MIDI_bass).start();
      }
      if(mute_flg[3] == 0){
        var Drum = new Tone.Part(addDrum, play_MIDI_Drum).start();
      }
      Tone.Transport.start();
      play_flg = 1;
    }else{
      Tone.Transport.stop();
      Tone.Transport.cancel();
      play_flg = 0;
    }
  })
});
