jQuery(function($){
  //MIDIinput_grids生成 ?191009
  var MIDI_Mscale = 72; //音階数 重すぎるのでヤマハ式のC1〜B6まで(72)
  var notes_measure = 32; //notesの列数 (デフォルト>> 16小節 * 16拍 = 216)
  var notes_amount = MIDI_Mscale * notes_measure;
  var Mscale_Do = ["ド", "ド#", "レ", "レ#", "ミ", "ファ", "ファ#", "ソ", "ソ#", "ラ", "ラ#", "シ"];
  var Mscale_C = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
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
  //ウィンドウサイズをリサイズした時 追記1005
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
    "C4" : "./audio/Piano_C4.wav",
  }, {attack:0.05 ,release:1.0}).toMaster();
  var Drum_sampler = new Tone.Sampler({
    "C1" : "./audio/Drum/Kick_C1.wav",
    "C#1" : "./audio/Drum/Snare_Cs1.wav",
    "D1" : "./audio/Drum/Snare_D1.wav",
    "E1" : "./audio/Drum/Snare_E1.wav",
    "F1" : "./audio/Drum/LowTom_F1.wav",
    "F#1" : "./audio/Drum/CH_Fs1.wav",
    "G1" : "./audio/Drum/LowTom_G1.wav",
    "G#1" : "./audio/Drum/CHF_Gs1.wav",
    "A1" : "./audio/Drum/MidTom_A1.wav",
    "A#1" : "./audio/Drum/OH_As1.wav",
    "B1" : "./audio/Drum/MidTom_B1.wav",
    "C2" : "./audio/Drum/HighTom_C2.wav",
    "C#2" : "./audio/Drum/CrashLeft_Cs2.wav",
    "D2" : "./audio/Drum/HighTom_D2.wav",
    "D#2" : "./audio/Drum/Ride_Ds2.wav",
    "E2" : "./audio/Drum/OH_E2.wav"
  }).toMaster();
  function addMelody(time, note) {
    polysynth.triggerAttackRelease(note, '16n', time);
  }
  function addChord(time, note) {
    polysynth.triggerAttackRelease(note, '16n', time);
  }
  function addBass(time, note) {
    plucksynth.triggerAttackRelease(note, '16n', time);
  }
  function addDrum(time, note) {
    Drum_sampler.triggerAttackRelease(note, '1n', time);
  }
  var MIDI_Melody = []; //小節:拍:拍内小節, 音名 保存に使用
  for(x=0; x<2; x++){
    for(y=0; y<4; y++){
      for(z=0; z<4; z++){
        MIDI_Melody.push([x+":"+y+":"+z, [""]]);
      }
    }
  }

  $(".notes").mousedown(function () {
    isMouseDown = true;
    $(this).toggleClass(".notes.highlighted");
    var note_name = $('.notes').index(this) % 12;
    var pitch =  Math.ceil((MIDI_Mscale-$('.notes').index(this)%MIDI_Mscale) / 12);
    var MIDI_note = Mscale_C[note_name] + pitch;
    var measure_count = $(this).parent().index();
    if($(this).hasClass('highlighted') == false){
      polysynth.triggerAttackRelease(Mscale_C[note_name]+pitch, '16n');

      if(MIDI_Melody[measure_count][1] == ""){
        MIDI_Melody[measure_count][1].splice(0, 1, MIDI_note);
        console.log("新規追加");
        console.log(MIDI_Melody);
      }else{
        MIDI_Melody[measure_count][1].push(MIDI_note);
        console.log("追加");
        console.log(MIDI_Melody);
      }
    }else{
      var highlight_index = $.inArray(MIDI_note, MIDI_Melody[measure_count][1]);
      MIDI_Melody[measure_count][1].splice(highlight_index, 1);
      console.log("削除");
      console.log(MIDI_Melody);
    }
    return false; // prevent text selection
  })
  .mouseover(function () {
    if (isMouseDown) {
      $(this).toggleClass(".notes.highlighted");
      var note_name = $('.notes').index(this) % 12;
      var pitch =  Math.ceil((MIDI_Mscale-$('.notes').index(this)%MIDI_Mscale) / 12);
      var MIDI_note = Mscale_C[note_name] + pitch;
      var measure_count = $(this).parent().index();
      if($(this).hasClass('highlighted') == false){
        polysynth.triggerAttackRelease(Mscale_C[note_name]+pitch, '16n');

        if(MIDI_Melody[measure_count][1] == ""){
          MIDI_Melody[measure_count][1].splice(0, 1, MIDI_note);
          console.log("新規追加");
          console.log(MIDI_Melody);
        }else{
          MIDI_Melody[measure_count][1].push(MIDI_note);
          console.log("追加");
          console.log(MIDI_Melody);
        }
      }else{
        var highlight_index = $.inArray(MIDI_note, MIDI_Melody[measure_count][1]);
        MIDI_Melody[measure_count][1].splice(highlight_index, 1);
        console.log("削除");
        console.log(MIDI_Melody);
      }
    }
  })
  .bind("selectstart", function () {
    return false; // prevent text selection in IE
  });
  $(document).mouseup(function () {
    isMouseDown = false;
  });
  $(".notes").mousedown(function () {
    isMouseDown = true;
    $(this).toggleClass("highlighted");
    return false; // prevent text selection
  })
  .mouseover(function () {
    if (isMouseDown) {
      $(this).toggleClass("highlighted");
    }
  })
  .bind("selectstart", function () {
    return false; // prevent text selection in IE
  });
  $(document).mouseup(function () {
    isMouseDown = false;
  });

  //受け渡された情報から表示する 読み込みに使用
  //Polysynthは和音に対応 三次元配列で記述可
  var test_Melody = [
    ["0:0:0", ["A5"]],
    ["0:0:1", [""]],
    ["0:0:2", ["F5"]],
    ["0:0:3", []],
    ["0:1:0", ["G5"]],
    ["0:1:1", []],
    ["0:1:2", ["A5"]],
    ["0:1:3", [""]],
    ["0:2:0", []],
    ["0:2:1", [""]],
    ["0:2:2", ["F6"]],
    ["0:2:3", []],
    ["0:3:0", ["E6"]],
    ["0:3:1", []],
    ["0:3:2", ["F6"]],
    ["0:3:3", []],
    ["1:0:0", ["E6"]],
    ["1:0:1", [""]],
    ["1:0:2", ["F6"]],
    ["1:0:3", []],
    ["1:1:0", ["E6"]],
    ["1:1:1", []],
    ["1:1:2", [""]],
    ["1:1:3", [""]],
    ["1:2:0", ["C6"]],
    ["1:2:1", [""]],
    ["1:2:2", ["D6"]],
    ["1:2:3", []],
    ["1:3:0", ["A5"]],
    ["1:3:1", []],
    ["1:3:2", ["G5"]],
    ["1:3:3", []]
  ];
  var Mscale_number = {"C":11, "C#":10, "D":9, "D#":8, "E":7, "F":6, "F#":5, "G":4, "G#":3, "A":2, "A#":1, "B":0}; //逆順
  for(y=0; y<test_Melody.length; y++){
    if(test_Melody[y][1].length > 0 && test_Melody[y][1][0] != ""){
      for(z=0; z<test_Melody[y][1].length; z++){
        if(MIDI_Melody[y][1] == ""){
          MIDI_Melody[y][1].splice(0, 1, test_Melody[y][1][0]);
        }else{
          MIDI_Melody[y][1].push(test_Melody[y][1][z]);
        }
        var pitch = test_Melody[y][1][z].slice(-1);
        if(test_Melody[y][1][z].length == 3){ //C#3
          var note_name = test_Melody[y][1][z].slice(0, 2);
        }else{
          var note_name = test_Melody[y][1][z].slice(0, 1);
        }
        $(".notes").eq(
          Mscale_number[note_name] + (6-pitch)*12 + y*MIDI_Mscale
        ).addClass("highlighted");
      }
    }
  }
  console.log("保存データ読み込み")
  console.log(MIDI_Melody);

  //コード生成
  var test_chord = [
    ["0:0:0", ["D3", "F3", "A3"]],
    ["0:0:1", [""]],
    ["0:0:2", []],
    ["0:0:3", []],
    ["0:1:0", ["D3", "F3", "A3"]],
    ["0:1:1", []],
    ["0:1:2", ["D3", "F3", "A3"]],
    ["0:1:3", [""]],
    ["0:2:0", [""]],
    ["0:2:1", [""]],
    ["0:2:2", ["D3", "F3", "A3"]],
    ["0:2:3", [""]],
    ["0:3:0", ["D3", "F3", "A3"]],
    ["0:3:1", [""]],
    ["0:3:2", []],
    ["0:3:3", [""]],
    ["1:0:0", ["A3", "C4", "E4"]],
    ["1:0:1", [""]],
    ["1:0:2", []],
    ["1:0:3", []],
    ["1:1:0", ["A3", "C4", "E4"]],
    ["1:1:1", []],
    ["1:1:2", ["A3", "C4", "E4"]],
    ["1:1:3", [""]],
    ["1:2:0", [""]],
    ["1:2:1", [""]],
    ["1:2:2", ["A3", "C4", "E4"]],
    ["1:2:3", [""]],
    ["1:3:0", ["A3", "C4", "E4"]],
    ["1:3:1", [""]],
    ["1:3:2", []],
    ["1:3:3", [""]]
  ];

  //ベース生成
  //Polysynth,sampler以外は二次元配列で記述
  var test_bass = [
    ["0:0:0", "D2"],
    ["0:0:1", ""],
    ["0:0:2", "D2"],
    ["0:0:3", ""],
    ["0:1:0", "D2"],
    ["0:1:1", ""],
    ["0:1:2", "D2"],
    ["0:1:3", ""],
    ["0:2:0", ""],
    ["0:2:1", ""],
    ["0:2:2", "D2"],
    ["0:2:3", ""],
    ["0:3:0", "D2"],
    ["0:3:1", ""],
    ["0:3:2", "F2"],
    ["0:3:3", ""],
    ["1:0:0", "A2"],
    ["1:0:1", ""],
    ["1:0:2", "A2"],
    ["1:0:3", ""],
    ["1:1:0", "A2"],
    ["1:1:1", ""],
    ["1:1:2", "A2"],
    ["1:1:3", ""],
    ["1:2:0", ""],
    ["1:2:1", ""],
    ["1:2:2", "A2"],
    ["1:2:3", ""],
    ["1:3:0", "A2"],
    ["1:3:1", ""],
    ["1:3:2", "A2"],
    ["1:3:3", ""]
  ];

  //ドラム生成
  var test_drum = [
    ["0:0:0", ["C1", "G#1", "C#2"]],
    ["0:0:1", [""]],
    ["0:0:2", ["G#1"]],
    ["0:0:3", [""]],
    ["0:1:0", ["G#1"]],
    ["0:1:1", [""]],
    ["0:1:2", ["C1", "G#1"]],
    ["0:1:3", ""],
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
    ["1:1:3", ""],
    ["1:2:0", ["G#1"]],
    ["1:2:1", [""]],
    ["1:2:2", ["G#1"]],
    ["1:2:3", [""]],
    ["1:3:0", ["C1", "A#1"]],
    ["1:3:1", [""]],
    ["1:3:2", ["G#1"]],
    ["1:3:3", [""]]
  ];

  //再生処理
  Tone.Transport.bpm.value = 220; //bpm
  var play_flg = 0;
  $("#play").click(function(){
    if(play_flg == 0){
      var play_MIDI_Melody = []; //再生用に無駄な情報を省いたもの
      var play_MIDI_Chord =[];
      var play_MIDI_Bass =[];
      var play_MIDI_Drum =[];
      for(z=0; z<test_bass.length; z++){ //本来はz<notes_measure
        if(MIDI_Melody[z][1].length > 0 && MIDI_Melody[z][1][0] != ""){
          play_MIDI_Melody.push(MIDI_Melody[z]);
        }
        if(test_chord[z][1].length > 0 && test_chord[z][1][0] != ""){
          play_MIDI_Chord.push(test_chord[z]);
        }
        if(test_bass[z][1] != ""){
          play_MIDI_Bass.push(test_bass[z]);
        }
        if(test_drum[z][1].length > 0 && test_drum[z][1][0] != ""){
          play_MIDI_Drum.push(test_drum[z]);
        }
      }
      console.log("再生");
      console.log(play_MIDI_Chord);
      if(mute_flg[0] == 0){
        var Melody = new Tone.Part(addMelody, play_MIDI_Melody).start();
      }
      if(mute_flg[1] == 0){
        var Chord = new Tone.Part(addChord, play_MIDI_Chord).start();
      }
      if(mute_flg[2] == 0){
        var Bass = new Tone.Part(addBass, play_MIDI_Bass).start();
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
