# chat/consumers.py
import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import *
from channels.db import database_sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    # Bağlantı başladığında çalışır
    async def connect(self):
        # URL'den odanın adını al
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        # Oda grubunun adını belirle
        self.room_group_name = "chat_%s" % self.room_name

        # Oda grubuna kullanıcıyı ekle
        await self.channel_layer.group_add(
            self.room_group_name,  # Oda grubunun adı
            self.channel_name       # Kullanıcının WebSocket kanal adı
        )
        # WebSocket bağlantısını kabul et
        await self.accept()
        
    # WebSocket bağlantısı kapandığında çalışır
    # async def disconnect(self, close_code):
    #     # Oda grubundan kullanıcıyı çıkar
    #     await self.channel_layer.group_discard(
    #         self.room_group_name,  # Oda grubunun adı
    #         self.channel_name       # Kullanıcının WebSocket kanal adı
    #     )

    # WebSocket'ten mesaj geldiğinde çalışır
    async def receive(self, text_data):
        # Mesajı JSON formatında ayrıştır
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        user = self.scope['user']  # Kullanıcıyı al
        tipi_nedir = text_data_json['tipi_nedir']  # Mesajın tipini al
        # Mesajı veritabanına kaydet
        await self.save_database(message, user, self.room_name, tipi_nedir)
        # Mesajı oda grubuna gönder
        await self.channel_layer.group_send(
            self.room_group_name, {
                "type": "chat_message",  # Oda grubunun alması gereken mesaj türü
                "message": message,      # Gönderilen mesaj
                'user': user.username,   # Kullanıcı adı
                'date': self.message_object.get_short_date(),  # Mesaj tarihi
                'tipi_nedir': tipi_nedir,  # Mesajın tipi
            }
        )

    # Django tarafından istemciye mesajı yollar
    async def chat_message(self, a):
        # Oda grubundan gelen mesaj verilerini al
        message = a["message"]
        user = a['user']
        date = a['date']
        tipi_nedir = a['tipi_nedir']
        
        # Mesajı WebSocket üzerinden istemciye gönder
        await self.send(text_data=json.dumps({
            "message": message,
            'user': user,
            'date': date,
            'tipi_nedir': tipi_nedir,
        }))

    @database_sync_to_async
    def save_database(self, message, user, room_name, tipi_nedir):
        # room_name UUID'ye dönüştürülmeli
        room = Room.objects.get(id=room_name)  # Oda adını kullanarak odayı bul
        # Yeni bir Message nesnesi oluştur ve veritabanına kaydet
        m = Message.objects.create(content=message, user=user, room=room, tipi_nedir=tipi_nedir)
        # Mesaj nesnesini sakla
        self.message_object = m
