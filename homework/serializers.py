from rest_framework import serializers
from homework.models import HomeworkOrder, OrderReview, ResponseBid, OrderDispute, DisputeMessage

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
    order = serializers.SerializerMethodField()

    class Meta:
        model = ResponseBid
        fields = "__all__"

    def get_author(self, obj):
        return {
            "id": obj.author.id,
            "username": obj.author.username
        }
    
    def get_order(self, obj):
        return {
            "id": obj.order.id,
            "status": obj.order.status
        }

class OrderReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderReview
        fields = "__all__"

class OrderDisputeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = OrderDispute
        fields = "__all__"
    
    def get_name(self, obj):
        return { 
            "author": obj.author.username,
            "opponent": obj.opponent.username
        }
    
class DisputeMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisputeMessage
        fields = "__all__"