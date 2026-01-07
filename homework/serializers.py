from rest_framework import serializers
from homework.models import HomeworkOrder, ResponseBid

class HomeworkOrderSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = HomeworkOrder
        fields = "__all__"

    def get_author(self, obj):
        return {
            "id": obj.author.id,
            "username": obj.author.username
        }
    
class ResponseBidSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = ResponseBid
        fields = "__all__"

    def get_author(self, obj):
        return {
            "id": obj.author.id,
            "username": obj.author.username
        }