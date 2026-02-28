from django.urls import path
from homework.api_views import (
    SearchOrdersAPIView,
    SearchOrderDetailAPIView,
    OrderAssignmentAPIView,
    OrderConfirmationAPIView,
    OrderCompletionAPIView,
    OrderReviewAPIView,
    OrderDisputeAPIView,
    MyOrdersAPIView,
    MyBidsAPIView,
    MyDisputesAPIView,
    DisputeDetailAPIView,
)

urlpatterns = [
    path("search/", SearchOrdersAPIView.as_view()),
    path("search/<int:order_id>/", SearchOrderDetailAPIView.as_view()),
    path("search/<int:order_id>/bid/", MyBidsAPIView.as_view()),
    
    path("search/bids/assign/<int:bid_id>/", OrderAssignmentAPIView.as_view()),
    path("search/orders/unassign/<int:order_id>/", OrderAssignmentAPIView.as_view()),

    path("search/orders/confirm/<int:order_id>/<int:message_id>/", OrderConfirmationAPIView.as_view()),
    path("search/orders/decline/<int:order_id>/<int:message_id>/", OrderConfirmationAPIView.as_view()),

    path("search/orders/complete/<int:order_id>/<int:message_id>/", OrderCompletionAPIView.as_view()),

    path("search/orders/review/<int:order_id>/<int:message_id>/", OrderReviewAPIView.as_view()),

    path("search/orders/dispute/<int:order_id>/<int:message_id>/", OrderDisputeAPIView.as_view()),

    path("orders/<int:order_id>/delete/", MyOrdersAPIView.as_view()),
    path("orders/", MyOrdersAPIView.as_view()),
    path("orders/<str:order_status>/", MyOrdersAPIView.as_view()),

    path("bids/<int:bid_id>/delete/", MyBidsAPIView.as_view()),
    path("bids/", MyBidsAPIView.as_view()),
    path("bids/<str:bid_status>/", MyBidsAPIView.as_view()),

    path("disputes/", MyDisputesAPIView.as_view()),
    path("disputes/<str:dispute_status>/", MyDisputesAPIView.as_view()),

    path("dispute/<int:dispute_id>/", DisputeDetailAPIView.as_view()),

]
