from django.contrib import admin
from chat.models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user1_info', 'user2_info', 'last_message_preview', 'created_at')

    search_fields = ('user1__username', 'user2__username')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)

    def user1_info(self, obj):
        return f"{obj.user1.username} (ID: {obj.user1.id})"
    user1_info.short_description = 'User 1'

    def user2_info(self, obj):
        return f"{obj.user2.username} (ID: {obj.user2.id})"
    user2_info.short_description = 'User 2'

    def last_message_preview(self, obj):
        if obj.last_message:
            return obj.last_message.text[:50] 
        return "Нет сообщений"
    last_message_preview.short_description = 'Последнее сообщение'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('chat__id', 'sender', 'type', 'text_preview', 'created_at')
    
    search_fields = ('text', 'sender__username')
    
    list_filter = ('type', 'created_at')
    
    readonly_fields = ('created_at',)

    def text_preview(self, obj):
        return obj.text[:50]
    text_preview.short_description = 'Текст (предпросмотр)'
