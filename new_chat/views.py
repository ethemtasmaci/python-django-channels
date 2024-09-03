from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib import auth

from django.contrib.auth.models import User
from chat.models import Room 

@login_required(login_url="login")
def create_room(request):
    if request.method == 'POST':
        # POST işlemi: yeni oda oluşturma
        room_name = request.POST.get('room_name')
        second_user_id = request.POST.get('second_user_id')
        first_user_id = request.user.id

        new_room = Room.objects.create(
            first_user_id=first_user_id,
            second_user_id=second_user_id,
            room_name=room_name
        )

        return redirect('/chat')
        
        # return JsonResponse({
        #     'room_id': new_room.id,
        #     'room_name': new_room.room_name,
        # })
    
    # GET işlemi: mevcut kullanıcıları al ve formda göster
    users = User.objects.exclude(id=request.user.id)  # Kendini listeden çıkar

    return render(request, 'chat/create_room.html', {'users': users})