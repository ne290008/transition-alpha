from django.shortcuts import render, redirect, get_object_or_404

def login(request):
    return render(request, 'daw/login.html', {})

def signup(request):
    return render(request, 'daw/signup.html', {})

def list(request):
    return render(request, 'daw/list.html', {})

def daw_start(request):
    return render(request, 'daw/start.html', {})

def daw_new(request):
    return render(request, 'daw/DAW.html', {})

def daw_edit(request):
    return render(request, 'daw/DAW.html', {})

# 開発用
def root(request):
    return redirect('daw_start')
