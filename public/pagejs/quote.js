// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

var textAreaBackground;
var textAreaBorder;
var isShowCaptureScreenButton = false;
var databaseData;

function printPage() {
    // get rid of the little extras
    cleanScreen();
    window.document.title = createFilename();
    // and print
    window.print();
}

function filenamePart(text) {
    if (!text) {
        return "";
    }
    else {
        return text.replace(/[^a-z0-9]/gmi, "");
    }
}

function createFilename() {
    var date = new Date();
    return "DisruptSports_"
        + filenamePart(databaseData['category_name']) + "_"
        + filenamePart(databaseData['name']) + "_"
        + filenamePart(databaseData['quality']) + "_"
        + (date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1) + "_" + (date.getFullYear());
}

function setupScreenCapture() {
    // get rid of the little extras
    cleanScreen();
    // and capture the screen
    var downloadButton = document.querySelector('#download_button');
    let region = document.querySelector("body"); // whole screen
    html2canvas(region, {
        onrendered: function(canvas) {
            let pngUrl = canvas.toDataURL(); // png in dataURL format
            let img = document.querySelector("#item_main_content");
            img.src = pngUrl; 
            // set this data as if the button were to download it
            downloadButton.href = pngUrl;
            downloadButton.download = createFilename();
            // button is set to download the image - initiate this
            downloadButton.click();
            putCleanBack();
        }
    });
}

function cleanScreen() {
    document.querySelector('#clean_button').style.display = "none";
    document.querySelector('#print_button').style.display = "none";
    document.querySelector('#capture_button').style.display = "none";
    
    var textArea = document.querySelector('#text_comments');
    if (textArea.value == '' || textArea.value == 'enter comments here') {
        textArea.style.display = 'none';
    }
    else {
        // remove the background and border though
        textAreaBackground = textArea.style.backgroundColor;
        textAreaBorder = textArea.style.border;
        textArea.style.backgroundColor = "transparent";
        textArea.style.border = "transparent";
    }
}

function putCleanBack() {
    document.querySelector('#clean_button').style.display = null;
    document.querySelector('#print_button').style.display = null;
    if (isShowCaptureScreenButton) {
        document.querySelector('#capture_button').style.display = null;
    }
    var textArea = document.querySelector('#text_comments');
    
    textArea.style.backgroundColor = textAreaBackground;
    textArea.style.border = textAreaBorder;
    textArea.style.display = null;
}

window.onafterprint = function(){
    putCleanBack();
 }

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    if (!isShowCaptureScreenButton) {
        // remove the capture screen button as doesn't do external images
        document.querySelector('#capture_button').style.display = "none";
    }
    else {
        document.querySelector('#capture_button').style.display = null;
    }
            
    var items = location.search.substr(1).split("&");
    var itemId = 0;
    var isGbp = false;
    var isUsd = false;
    var isAud = false;
    var isNotes = true;
    for (var index = 0; index < items.length; index++) {
        var tmp = items[index].split("=");
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
            databaseData = itemData;
            setContainerData(itemDiv, 'item', 'category_name', itemId, itemData);
            setContainerData(itemDiv, 'item', 'name', itemId, itemData);
            setContainerData(itemDiv, 'item', 'quality', itemId, itemData);
            setContainerData(itemDiv, 'item', 'description', itemId, itemData);
            setContainerData(itemDiv, 'item', 'notes', itemId, itemData);
            setContainerData(itemDiv, 'item', 'url', itemId, itemData);

            // and do the image
            var image = itemDiv.querySelector('#item_image');
            image.id = "item_image_" + itemId;
            if (itemData.image) {
                image.src = itemData.image;
            }
            else {
                image.style.display = 'none';
            }
            // and the link
            var linkTitle = itemDiv.querySelector('#item_url_' + itemId)
            if (itemData.url && linkTitle) {
                linkTitle.href = itemData.url;
                linkTitle.innerHTML = "external link";
                linkTitle.style.display = null;
            }
            else if (linkTitle) {
                linkTitle.style.display = "none";
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
                            // this is the last item loaded, print this out then, giving the image a second to load
                            //setTimeout(function(){ window.print(); }, 1000);
                            document.querySelector('#print_button').classList.remove('disabled');
                            document.querySelector('#capture_button').classList.remove('disabled');
                            document.querySelector('#text_comments').value = "enter comments here";
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