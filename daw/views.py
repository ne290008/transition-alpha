from django.shortcuts import render, redirect, get_object_or_404

# TODO: クラスベースのビューに書き換える

def list(request):
    return render(request, 'daw/list.html', {})

def daw_start(request):
    return render(request, 'daw/start.html', {})

def daw_new(request):
    return render(request, 'daw/DAW.html', {})

def daw_edit(request):
    return render(request, 'daw/DAW.html', {})

# テスト用
def daw_start_p(request):
    return render(request, 'daw/test/start_p.html', {})

def daw_new_p(request):
    artist = request.POST.get('artist')
    key = request.POST.get('key')
    beat = request.POST.get('beat')
    chords = request.POST.get('chords')
    return render(request, 'daw/DAW.html',
            {'artist': artist, 'key': key, 'beat': beat, 'chords': chords})

def daw_start_s(request):
    return render(request, 'daw/test/start_s.html', {})

def daw_new_s(request):
    return render(request, 'daw/DAW.html', {})
