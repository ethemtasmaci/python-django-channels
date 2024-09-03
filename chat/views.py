from django.contrib import auth
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from .models import *
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

@login_required(login_url="login")
def index(request):
    user = request.user  # Giriş yapan kullanıcıyı al
    users = User.objects.all().exclude(username=user.username)  # Kullanıcıyı hariç tutarak diğer tüm kullanıcıları al

    # Kullanıcının bulunduğu odaları alalım
    rooms_as_first_user = Room.objects.filter(first_user_id=user.id)  # Kullanıcının first_user_id olarak bulunduğu odalar
    rooms_as_second_user = Room.objects.filter(second_user_id=user.id)  # Kullanıcının second_user_id olarak bulunduğu odalar

    # Kullanıcının bulunduğu tüm odaları birleştir
    user_rooms = rooms_as_first_user.union(rooms_as_second_user)

    # Şablona gerekli verileri gönder
    return render(request, "chat/index.html", {
        'users': users,
        'user_rooms': user_rooms,  # Bu kısmı değiştirmeye gerek yok
    })

@login_required(login_url="login")
def chat_room(request, room_id):
    room = get_object_or_404(Room, id=room_id)
    return render(request, 'chat/room.html', {
        'room': room,
        'room_name': room.room_name,
    })

    
@login_required(login_url="login")
def room(request, room_name):
    users = User.objects.all().exclude(username=request.user)
    room = Room.objects.get(id=room_name)
    messages = Message.objects.filter(room=room)

    if request.user != room.first_user:
        if request.user != room.second_user:
            return redirect('index')

    context = {
        "room_name": room_name,
        'users':users,
        'room':room,
        'messages':messages,
        }

    return render(request, "chat/room.html", context)
    

def Login(request):
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(username=username,password=password)

        if user is not None:
            login(request,user)
            return redirect('index')
        else:
            return redirect("Login")
    
    return render(request, "chat/login.html")

def logout(request):
    auth.logout(request)
    return redirect('login')