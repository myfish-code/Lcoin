from django.shortcuts import render

from homework.models import HomeworkOrder

# Create your views here.

def search_view(request):
    orders = HomeworkOrder.objects.all()

    return render(request,'homework/search.html', {'orders': orders})


def orders_view(request):

    if request.method == "POST":
        name = request.POST.get("name")
        description = request.POST.get("description")
        price = request.POST.get("price")
        deadline_time = request.POST.get("deadline_time")
        subject = request.POST.get("subject")

        HomeworkOrder.objects.create(
            name=name,
            description=description,
            price=price,
            deadline_time=deadline_time,
            subject=subject,
            author=request.user
        )


    orders = HomeworkOrder.objects.filter(author=request.user)


    return render(request, 'homework/orders.html', {'orders': orders})