from rest_framework import serializers
from chat.models import Message, Conversation

class ConversationSerializer(serializers.ModelSerializer):
    user1_name = serializers.SerializerMethodField()
    user2_name = serializers.SerializerMethodField()

    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "user1_name", "user2_name", "last_message"]

    def get_user1_name(self, obj):
        return obj.user1.username

    def get_user2_name(self, obj):
        return obj.user2.username
    
    def get_last_message(self, obj):
        if obj.last_message:
            return obj.last_message.text
        
        return None

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = "__all__"

