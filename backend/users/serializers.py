from users.models import Client
from rest_framework import serializers

class ClientSerializer(serializers.ModelSerializer):
    customer_info = serializers.SerializerMethodField()
    executor_info = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ['id', 'username', 'email', 'coins', 'customer_info', 'executor_info', 'language', 'verification_status', 'verification_rejected_reason']

    def get_customer_info(self, obj):
        return {
            "total_reviews": obj.customer_stars_count,
            "rating": float(obj.customer_rating)
        }
    
    def get_executor_info(self, obj):
        return {
            "total_reviews": obj.executor_stars_count,
            "rating": float(obj.executor_rating)
        }
