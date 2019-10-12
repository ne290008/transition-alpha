from django.shortcuts import render, redirect, get_object_or_404

def list(request):
    #return render(request, 'daw/list.html', {})
    '''
    listのテンプレートができるまでは
    ルートへのアクセスはDAWのスタート画面にリダイレクトさせる
    '''
    return redirect('daw_start')

def daw_start(request):
    return render(request, 'daw/start.html', {})

def daw_new(request):
    return render(request, 'daw/DAW.html', {})

def daw_edit(request):
    return render(request, 'daw/DAW.html', {})
