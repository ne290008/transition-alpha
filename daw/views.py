from django.shortcuts import render, redirect, get_object_or_404

# TODO: クラスベースのビューに書き換える

def index(request):
    return render(request, 'daw/index.html', {})

def daw_start(request):
    return render(request, 'daw/start.html', {})

def daw_new(request):
    return render(request, 'daw/DAW.html', {})

def daw_edit(request):
    return render(request, 'daw/DAW.html', {})
