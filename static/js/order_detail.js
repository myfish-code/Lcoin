document.addEventListener("DOMContentLoaded", function() {
    const ShowBidBtn = document.getElementById("show-bid-form");
    const BidForms = document.getElementById("bid-form-container");

    if (ShowBidBtn && BidForms) {
        ShowBidBtn.addEventListener("click", function(e) {
            e.preventDefault();
            BidForms.style.display="block";

        });

    }

});