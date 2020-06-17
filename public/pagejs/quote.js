// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page



document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
            
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    var itemId = 0;
    var isGbp = false;
    var isUsd = false;
    var isAud = false;
    var isNotes = true;
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        var parameterName = tmp[0];
        var result = decodeURIComponent(tmp[1]);
        if (parameterName === 'itemId') {
            itemId = result;
        }
        else if (parameterName === 'gbp') {
            isGbp = result === 'true';
        }
        else if (parameterName === 'usd') {
            isUsd = result === 'true';
        }
        else if (parameterName === 'aud') {
            isAud = result === 'true';
        }
        else if (parameterName === 'notes') {
            isNotes = result === 'true';
        }
    }
    
    // setup the table correctly
    var table = document.querySelector('#quantity_data_table');
    table.id = "prices_table_" + itemId;

    var header = document.querySelector('#table_header_gbp');
    if (!isGbp) {
        header.parentElement.removeChild(header);
    }
    header = document.querySelector('#table_header_usd');
    if (!isUsd) {
        header.parentElement.removeChild(header);
    }
    header = document.querySelector('#table_header_aud');
    if (!isAud) {
        header.parentElement.removeChild(header);
    }
    header = document.querySelector('#table_header_notes');
    if (!isNotes) {
        header.parentElement.removeChild(header);
    }

    var itemDiv = document.getElementById('item_main_content');
    firebaseData.getItemData(itemId,
        function(itemData) {
            setContainerData(itemDiv, 'item', 'category_name', itemId, itemData);
            setContainerData(itemDiv, 'item', 'name', itemId, itemData);
            setContainerData(itemDiv, 'item', 'quality', itemId, itemData);
            setContainerData(itemDiv, 'item', 'description', itemId, itemData);

            // and do the image
            var image = itemDiv.querySelector('#item_image');
            image.id = "item_image_" + itemId;
            if (itemData.image) {
                image.src = itemData.image;
            }
            else {
                image.style.display = 'none';
            }
            // we will also want to show all the quantities under this item
            firebaseData.getQuantitiesInItem(itemId,
                function(querySnapshot) {
                    // have all the items here, add them all to the category
                    var noItems = querySnapshot.size;
                    var itemCount = 0;
                    querySnapshot.forEach(function(doc) {
                        // for each doc (item) add the data
                        onQuantityFound(table, doc.id, doc.data(), !isGbp, !isUsd, !isAud, !isNotes);
                        if (++itemCount === noItems) {
                            // this is the last item loaded, print this out then
                            window.print();
                        }
                    })
                },
                function(error) {
                    console.log('failed to find the quantities in an item', error);
                });
        },
        function(error) {
            console.log('failed to find the quantities in an item', error);
        });
});