from rest_framework import serializers
from homework.models import HomeworkOrder, OrderReview, ResponseBid

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