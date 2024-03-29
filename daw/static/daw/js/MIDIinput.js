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
  var isMouseDown = false; //マウスを押下しているか
  var isShiftDown = false; //シフトキーをマウス押下時に押下していたか
  var polysynth_melody = new Tone.PolySynth().toMaster(); //Melody用
  polysynth_melody.pan = 1000;
  var polysynth_chord = new Tone.PolySynth().toMaster(); //Chord用
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
    polysynth_melody.triggerAttackRelease(note.note, note.duration, time);
  }
  function addChord(time, note) {
    polysynth_chord.triggerAttackRelease(note.note, note.duration, time);
  }
  function addBass(time, note) {
    plucksynth.triggerAttackRelease(note, '16n', time);
  }
  function addDrum(time, note) {
    Drum_sampler.triggerAttackRelease(note, '1n', time);
  }

  //エフェクト
  var effect_selecter = [[1, 0, 1, 0, 0], [0, 1, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 1, 0, 0]]
  var ef_amount = 5;

  var effect_list = [
    "", "", ""
  ];
  effect_list[0] = new Tone.Freeverb().toMaster(); //リバーブ
  effect_list[1] = new Tone.Chorus().toMaster(); //コーラス
  effect_list[2] = new Tone.Distortion().toMaster(); //ディストーション
  effect_list[3] = new Tone.FeedbackDelay().toMaster(); //ディレイ
  effect_list[4] = new Tone.AutoWah(50, 6, -30).toMaster(); //ワウ

  //エフェクトのコントロール
  function ef_control(inst, idx, load){ //配列の値が1ならエフェクトオン loadなら処理をスキップ
    if(inst == 0){ //Melody
      if(effect_selecter[inst][idx] == 1){
        polysynth_melody.connect(effect_list[idx]);
      }else if(load){

      }else{
        polysynth_melody.disconnect(effect_list[idx]);
      }
    }else if(inst == 1){ //Chord
      if(effect_selecter[inst][idx] == 1){
        polysynth_chord.connect(effect_list[idx]);
      }else if(load){

      }else{
        polysynth_chord.disconnect(effect_list[idx]);
      }
    }else if(inst == 2){ //Bass
      if(effect_selecter[inst][idx] == 1){
        plucksynth.connect(effect_list[idx]);
      }else if(load){

      }else{
        plucksynth.disconnect(effect_list[idx]);
      }
    }else if(inst == 3){ //Drum
      if(effect_selecter[inst][idx] == 1){
        Drum_sampler.connect(effect_list[idx]);
      }else if(load){

      }else{
        Drum_sampler.disconnect(effect_list[idx]);
      }
    }
  }
  //ロード処理
  var count = 0;
  for(var x=0; x<4; x++){
    for(var y=0; y<ef_amount; y++){
      if(effect_selecter[x][y] == 1){
        $(".effect_list > li").eq(count).addClass("ef_selected");
      }
      ef_control(x, y, true);
      count += 1;
    }
  }
  //クリック時の処理
  $(".effect_list > li").on("click", function(){
    $(this).toggleClass("ef_selected");
    var ef_idx = $('.effect_list > li').index(this) % ef_amount;
    var ef_inst = Math.floor($('.effect_list > li').index(this) / ef_amount);
    if(effect_selecter[ef_inst][ef_idx] == 0){
      effect_selecter[ef_inst][ef_idx] = 1;
    }else{
      effect_selecter[ef_inst][ef_idx] = 0;
    }
    ef_control(ef_inst, ef_idx);
    console.log(effect_selecter);
  });

  // var MIDI_Melody = []; //小節:拍:拍内小節, 音名 保存に使用
  // CHANGED: menubar.js内でも参照したいため、グローバル変数として定義
  for(x=0; x<notes_measure/16; x++){ //
    for(y=0; y<4; y++){
      for(z=0; z<4; z++){
        MIDI_Melody.push({"time":x+":"+y+":"+z, "note":[""], "duration":"16n"});
      }
    }
  }
  var note_position = 0;
  var ml_column = 0; //どの行？
  var ml_line = 0; //どの列？
  var first_line = 0; //最初の列
  var line_count = 0; //現在ml_highlitedにした列数
  var remove_flg = 0; //消す処理をしているか否か

  $(".notes").mousedown(function(event) {
    isMouseDown = true;
    if(event.shiftKey == true){
      isShiftDown = true;
    }
    note_position = $('.notes').index(this); //ノートの全体からの位置
    var note_name = note_position % 12;
    var pitch =  Math.ceil((MIDI_Mscale-note_position%MIDI_Mscale) / 12);
    var MIDI_note = Mscale_C[note_name] + pitch;
    var measure_count = $(this).parent().index();
    if(isShiftDown == false && $(this).hasClass("ml_highlighted") == false){
      if($(this).hasClass('highlighted') == false){
        polysynth_melody.triggerAttackRelease(Mscale_C[note_name]+pitch, '16n');

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
    //長音を入れることができる条件：シフトキー かつ 短音が入ってない かつ 長音が入ってない かつ 同じ列に長音の始点がない
    }else if(isShiftDown == true && $(this).hasClass("highlighted") == false && $(this).hasClass("ml_highlighted") == false && MIDI_Melody[$(this).parent().index()].duration == "16n"){
      //長音の処理
      ml_column = note_position % MIDI_Mscale;
      if($(this).hasClass('ml_highlighted') == false){
        polysynth_melody.triggerAttackRelease(Mscale_C[note_name]+pitch, '16n');
      }
      $(this).addClass("ml_highlighted");
      first_line = $(this).parent().index();
    }else if($(this).hasClass("ml_highlighted") == true){
      //長音を消す処理
      remove_flg = 1;
      ml_column = note_position % MIDI_Mscale;
      ml_line = $(this).parent().index();
      var x = 0;
      while(true){
        if(MIDI_Melody[ml_line - x].duration != "16n"){
          first_line = ml_line - x;
          var last_line = MIDI_Melody[first_line].duration.replace("n", "");
          MIDI_Melody[first_line].note.splice(
            MIDI_Melody[first_line].note.indexOf(MIDI_note) ,1
          );
          MIDI_Melody[first_line].duration = "16n";
          break;
        }
        x++;
      }
      for(y=first_line; y<last_line; y++){
        var now_note = ml_column + (y * MIDI_Mscale);
        $(".notes").eq(now_note).removeClass("ml_highlighted");
      }
    }
    return false; // prevent text selection
  })
  .mouseover(function() {
    if (isMouseDown) {
      var note_name = note_position % 12;
      var pitch =  Math.ceil((MIDI_Mscale-note_position%MIDI_Mscale) / 12);
      var MIDI_note = Mscale_C[note_name] + pitch;
      var measure_count = $(this).parent().index();
      if(isShiftDown == false && $(this).hasClass("ml_highlighted") == false){
        if($(this).hasClass('highlighted') == false){
          polysynth_melody.triggerAttackRelease(Mscale_C[note_name]+pitch, '16n');

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
      }else if(isShiftDown == true && $(this).hasClass("highlighted") == false && remove_flg == 0){
        //長音の処理
        ml_line = $(this).parent().index();
        if(ml_line > first_line+line_count){
          $(".notes").eq(MIDI_Mscale*ml_line+ml_column).addClass("ml_highlighted");
          line_count += 1;
        }
      }
    }
  })
  .bind("selectstart", function () {
    return false; // prevent text selection in IE
  });
  $(document).mouseup(function() {
    isMouseDown = false;
    if(line_count > 0){ //長音の処理
      var note_name = ml_column % 12;
      var pitch =  Math.ceil((MIDI_Mscale-ml_column) / 12);
      var MIDI_note = Mscale_C[note_name] + pitch;
      if(MIDI_Melody[first_line].note == ""){
        MIDI_Melody[first_line].note.splice(0, 1, MIDI_note);
        MIDI_Melody[first_line].duration = (16-line_count) + "n";
      }else{
        MIDI_Melody[first_line].note.push(MIDI_note);
        MIDI_Melody[first_line].duration = (16-line_count) + "n";
      }
    //長音にならなかった場合 >> 削除
    }else if(isShiftDown && MIDI_Melody[ml_line].duration == "16n"){
      $(".notes").eq(note_position).removeClass("ml_highlighted");
    }
    //変数の初期化
    remove_flg = 0;
    ml_line = 0;
    line_count = 0;
    isShiftDown = false;
  })

  //受け渡された情報からメロディを表示する 読み込みに使用
  //Polysynthは和音に対応 三次元配列で記述可
  // OPTIMIZE: アプリケーションとしては不要となるため削除すべき
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
  ];
  var Mscale_number = {"C":11, "C#":10, "D":9, "D#":8, "E":7, "F":6, "F#":5, "G":4, "G#":3, "A":2, "A#":1, "B":0}; //逆順

  // CHANGED: メロディデータを引数として受け取るように変更
  function Melody_display(melody){
    for(y=0; y<melody.length; y++){
      if(melody[y].note.length > 0 && melody[y].note[0] != ""){
        for(z=0; z<melody[y].note.length; z++){
          if(MIDI_Melody[y].note == ""){ //音情報
            MIDI_Melody[y].note.splice(0, 1, melody[y].note[0]);
          }else{
            MIDI_Melody[y].note.push(melody[y].note[z]);
          }
          var pitch = melody[y].note[z].slice(-1);
          if(melody[y].note[z].length == 3){ //C#3
            var note_name = melody[y].note[z].slice(0, 2);
          }else{
            var note_name = melody[y].note[z].slice(0, 1);
          }
          $(".notes").eq( //highlighted
            Mscale_number[note_name] + (6-pitch)*12 + y*MIDI_Mscale
          ).addClass("highlighted");
        }
      }
    }
    console.log("保存データ読み込み")
    console.log(MIDI_Melody);
  };
  Melody_display(melody);  // テスト時はtest_Melodyを渡すとよい


  //コード(文字列からの生成)
  //受け渡されるデータ(コードストローク、ドラムパターン)
  var rhythm_pattern = "A"; //A,B,Cのいずれか
  var test_chord2_original = "Dm Am Bb F"; //Chainerからの出力
  // COMBAK: わざわざtest_chord2_originalに入れる必要性があるのか？
  test_chord2_original = chord_prog;

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
      if(chord_stroke[rhythm_pattern][x*16+y].note.length > 0 && chord_stroke[rhythm_pattern][x*16+y].note[0] != ""){
        MIDI_chord.push(chord_stroke[rhythm_pattern][x*16+y]);
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
  console.log(MIDI_chord);

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

  //ボリューム・ミュート・パン
  //ボリューム
  var melodyvol = 0;
  polysynth_melody.volume.value = melodyvol; //音量の値を初期値に代入
  $('.volume').eq(0).html(melodyvol);
  $('.volume').eq(0).on('input change', function() {
    melodyvol = $(this).val();
    $('.volume').eq(0).html(melodyvol);
    polysynth_melody.volume.value = melodyvol;
  });
  var chordvol = 0;
  polysynth_chord.volume.value = chordvol;
  $('.volume').eq(1).html(chordvol);
  $('.volume').eq(1).on('input change', function() {
    chordvol = $(this).val();
    $('.volume').eq(1).html(chordvol);
    polysynth_chord.volume.value = chordvol;
  });
  var bassvol = 0;
  plucksynth.volume.value = bassvol;
  $('.volume').eq(2).html(bassvol);
  $('.volume').eq(2).on('input change', function() {
    bassvol = $(this).val();
    $('.volume').eq(2).html(bassvol);
    plucksynth.volume.value = bassvol;
  });
  var drumvol = 0;
  Drum_sampler.volume.value = drumvol;
  $('.volume').eq(3).html(drumvol);
  $('.volume').eq(3).on('input change', function() {
    drumvol = $(this).val();
    $('.volume').eq(3).html(drumvol);
    Drum_sampler.volume.value = drumvol;
  });

  //ミュート
  $(".mute").eq(0).on("click", function(){
    if($(this).hasClass("active")){
      polysynth_melody.volume.value = -Infinity;
    }else{
      polysynth_melody.volume.value = melodyvol;
    }
  });
  $(".mute").eq(1).on("click", function(){
    if($(this).hasClass("active")){
      polysynth_chord.volume.value = -Infinity;
    }else{
      polysynth_chord.volume.value = chordvol;
    }
  });
  $(".mute").eq(2).on("click", function(){
    if($(this).hasClass("active")){
      plucksynth.volume.value = -Infinity;
    }else{
      plucksynth.volume.value = bassvol;
    }
  });
  $(".mute").eq(3).on("click", function(){
    if($(this).hasClass("active")){
      Drum_sampler.volume.value = -Infinity;
    }else{
      Drum_sampler.volume.value = drumvol;
    }
  });

  //パン



  //再生処理
  var Seekbar_position = 0;
  function seekbar_move(){
    if(Seekbar_position > notes_measure){
      Seekbar_position = 0;
      $(".Seekbar").remove();
      $(".MIDI_notes").eq(Seekbar_position).after("<div class=\"Seekbar\">");
    }else{
      $(".Seekbar").remove();
      $(".MIDI_notes").eq(Seekbar_position).after("<div class=\"Seekbar\">");
      Seekbar_position++;
    }
  }
  var Measure_position = "0:0:0";
  function Measure_calc(num){
    var a = Math.floor(num / 16);
    var b = Math.floor(num / 4) % 4;
    var c = num % 4;
    if(a > 7){
      Measure_position = "0:0:0";
    }else{
      Measure_position = (a+":"+b+":"+c);
    }
  }
  $(".exbar .gr").html(Measure_position);
  $(".extime .gr").html("00:00");

  $("#backward").on("click", function(){ //シークバーを初期位置に戻すよ
    Tone.Transport.stop();
    Tone.Transport.cancel();
    play_flg = 0;
    $('.play-btn').show();
    $('.stop-btn').hide();
    Seekbar_position = 0;
    $(".Seekbar").remove();
    $(".MIDI_notes").eq(Seekbar_position).before("<div class=\"Seekbar\">");
    Measure_position = "0:0:0";
    $(".exbar .gr").html(Measure_position);
    $(".extime .gr").html("00:00");
    $(".note_grid").scrollLeft(0);
  });
  $("#play").click(function(){
    Tone.Transport.bpm.value = bpm; //bpm
    if(play_flg == 0){
      var play_MIDI_Melody = []; //再生用に無駄な情報を省いたもの
      var play_MIDI_Drum =[];
      for(z=0; z<drum_pattern[rhythm_pattern].length; z++){ //本来はz<notes_measure
        if(MIDI_Melody[z].note.length > 0 && MIDI_Melody[z].note[0] != ""){
          play_MIDI_Melody.push(MIDI_Melody[z]);
        }
        if(drum_pattern[rhythm_pattern][z][1].length > 0 && drum_pattern[rhythm_pattern][z][1][0] != ""){
          play_MIDI_Drum.push(drum_pattern[rhythm_pattern][z]);
        }
      }
      var Melody = new Tone.Part(addMelody, play_MIDI_Melody).start();
      var Chord = new Tone.Part(addChord, MIDI_chord).start();
      var Bass = new Tone.Part(addBass, MIDI_bass).start();
      var Drum = new Tone.Part(addDrum, play_MIDI_Drum).start();

      Tone.Transport.seconds = Measure_position; //再生位置
      Tone.Transport.scheduleRepeat(function(){ //シークバー
        seekbar_move();
        Measure_calc(Seekbar_position);
        $(".exbar .gr").html(Measure_position);
        if(Tone.Transport.getSecondsAtTime()%60 > 10){
          var Seekbar_time = "0"+Math.floor(Tone.Transport.getSecondsAtTime()/60)+":"+Math.floor(Tone.Transport.getSecondsAtTime()%60);
        }else{
          var Seekbar_time = "0"+Math.floor(Tone.Transport.getSecondsAtTime()/60)+":"+"0"+Math.floor(Tone.Transport.getSecondsAtTime()%60);
        }
        $(".extime .gr").html(Seekbar_time);
        //console.log($('.Seekbar').offset().left);
        //$(".note_grid").scrollLeft($('.MIDI_notes').eq(Seekbar_position).offset().left);
      }, "16n");
      Tone.Transport.loop = true;
      Tone.Transport.loopEnd = "7:3:3";
      Tone.Transport.start(console.log("FA"));
      play_flg = 1;
    }else{
      Tone.Transport.stop();
      Tone.Transport.cancel();
      play_flg = 0;
    }
  })
});
