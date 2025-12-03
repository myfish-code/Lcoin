from rest_framework import serializers
from homework.models import HomeworkOrder, ResponseBid

class HomeworkOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkOrder
        fields = "__all__"

class ResponseBidSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResponseBid
        fields = "__all__"