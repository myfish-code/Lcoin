from django.shortcuts import render, redirect, get_object_or_404

from homework.models import HomeworkOrder, ResponseBid

# Create your views here.

def search_view(request):
    orders = HomeworkOrder.objects.all()

    return render(request,'homework/search.html', {'orders': orders})


def orders_view(request):

    error_message = None
    user = request.user

    if request.method == "POST":

        
        
        name = request.POST.get("name")
        description = request.POST.get("description")
        price = request.POST.get("price")
        deadline_time = request.POST.get("deadline_time")
        subject = request.POST.get("subject")

        if int(price) > user.coins:
            error_message = "Недостаточно монет для создания заказа!"
        else:

            HomeworkOrder.objects.create(
                name=name,
                description=description,
                price=price,
                deadline_time=deadline_time,
                subject=subject,
                author=request.user
            )

            user.coins -= int(price)
            user.save()



    orders = HomeworkOrder.objects.filter(author=request.user)

    context = {
        'orders': orders,
        'error_message': error_message,
        'coins': user.coins
    }
    return render(request, 'homework/orders.html', context)


def order_delete_view(request, order_id):
    user = request.user

    order = get_object_or_404(HomeworkOrder, id=order_id, author=user)

    user.coins += int(order.price)

    order.delete()
    user.save()

    return redirect('homework:orders')

def order_detail_view(request, order_id):
    order = get_object_or_404(HomeworkOrder, id=order_id)
    bids = ResponseBid.objects.filter(order=order)

    context = {
        'order':order,
        'bids':bids,
    }   

    return render(request,'homework/order_detail.html', context)

def create_bid(request, order_id):
    if request.method == "POST":
        description = request.POST.get("description")
        price = int(request.POST.get("price"))
        days_to_complete = int(request.POST.get("days_to_complete"))
        order = get_object_or_404(HomeworkOrder, id=order_id)

        ResponseBid.objects.create(
            description=description,
            author=request.user,
            price=price,
            order=order,
            days_to_complete=days_to_complete
        )



    return redirect("homework:order_detail", order_id=order_id)

def bids_view(request):
    
    bids = ResponseBid.objects.filter(author=request.user)

    return render(request, 'homework/bids.html', {'bids': bids})