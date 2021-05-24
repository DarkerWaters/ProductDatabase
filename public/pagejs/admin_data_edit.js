// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

var categoriesFound;
var categoryIdSelected;
var categoryDataSelected;
var itemIdSelected;
var itemDataSelected;
var quantityIdsSelected;
var quantityDataSelected;

function onCategoryFound(categoryContainer, categoryId, categoryData) {
    if (categoriesFound.includes(categoryId)) {
        // already added
    }
    else {
        // remember we added this already
        categoriesFound.push(categoryId);
        // create a link for this found container
        var catLinkDiv = document.getElementById('template_category_link').cloneNode(true);
        // set the unique ID for this
        catLinkDiv.innerHTML = categoryData.name;
        // and add to the container
        categoryContainer.appendChild(catLinkDiv);

        // we will also want to show all the items under this category
        firebaseData.getItemsInCategory(categoryId,
            function(querySnapshot) {
                // have all the items here, add them all to the category
                querySnapshot.forEach(function(doc) {
                    // for each doc (item) add the data
                    var itemLinkDiv = document.getElementById('template_item_link').cloneNode(true);
                    // set the unique ID for this
                    itemLinkDiv.id = "link_item_" + doc.id;
                    var itemData = doc.data();
                    var links = itemLinkDiv.getElementsByTagName('a');
                    for (var i = 0; i < links.length; ++i) {
                        links[i].id = "link_" + i + "_" + doc.id;
                        links[i].href = "#" + doc.id;
                        links[i].innerHTML = itemData.name;
                        links[i].onclick = function() {
                            // show the category when this is clicked
                            populateCategoryData(categoryId, categoryData);
                            populateItemData(doc.id, itemData);
                        };
                    }
                    categoryContainer.insertBefore(itemLinkDiv, catLinkDiv.nextSibling)
                })
            },
            function(error) {
                console.log('failed to find the items in a category', error);
            });
    }
}

function onSubmitSearch() {
    // search the selected categories for matches, find all the categories to show from those matched
    var categoryContainer = document.getElementById('found_categories');
    var searchTerm = document.getElementById('search').value;
    // clear all the old data
    categoryContainer.innerHTML = "";
    categoriesFound = [];

    // search for categories only
    firebaseData.searchCollectionForWord(firebaseData.collectionCategories, 'name', searchTerm,
        function(querySnapshot) {
            // success, add all to the HTML
            querySnapshot.forEach(function (doc) {
                // show each of these found documents in the HTML
                onCategoryFound(categoryContainer, doc.id, doc.data())
            });
        },
        function (error) {
            // failed
            console.log('searching failed: ', error);
        });
}

function fillEdit(level, dataName, dataValue) {
    var element = document.getElementById(level + '_' + dataName + '_edit');
    element.value = dataValue ? dataValue : '';
    element.onchange = function() {
        setDataChanged(true);
    }
}

function getEditedData(level, dataName) {
    return document.getElementById(level + '_' + dataName + '_edit').value;
}

function setDataChanged(isDataChanged) {
    var saveButton = document.getElementById('save_button');
    if (isDataChanged) {
        saveButton.classList.add('special');
    }
    else {
        saveButton.classList.remove('special');
    }
}

function populateCategoryData(categoryId, categoryData) {
    categoryIdSelected = categoryId;
    categoryDataSelected = categoryData;

    // set the title
    document.getElementById('category_name').innerHTML = categoryData.name;
    // and fill the edit boxes
    fillEdit('category', 'name', categoryData.name);
    fillEdit('category', 'description', categoryData.description);
    fillEdit('category', 'notes', categoryData.notes);
    fillEdit('category', 'image', categoryData.image);

    // and do the image
    var image = document.getElementById('category_image');
    if (categoryData.image) {
        image.src = categoryData.image;
    }
}

function populateItemData(itemId, itemData) {
    itemIdSelected = itemId;
    itemDataSelected = itemData;
    quantityIdsSelected = [];
    quantityDataSelected = [];

    // set the title
    document.getElementById('item_name').innerHTML = itemData.name;
    // and fill the edit boxes
    fillEdit('item', 'name', itemData.name);
    fillEdit('item', 'quality', itemData.quality);
    fillEdit('item', 'description', itemData.description);
    fillEdit('item', 'notes', itemData.notes);
    fillEdit('item', 'image', itemData.image);
    fillEdit('item', 'url', itemData.url);

    // and do the image
    var image = document.getElementById('item_image');
    if (itemData.image) {
        image.src = itemData.image;
    }
    fillEdit('item', 'physical', itemData.physical);
    fillEdit('item', 'colours', itemData.colours);
    fillEdit('item', 'supplier', itemData.supplier);

    // need to get the quantities for this item
    var table = document.getElementById('quantity_data_table');
    // and clear the body out
    table.getElementsByTagName('tbody')[0].innerHTML = "";
    firebaseData.getQuantitiesInItem(itemId,
        function(querySnapshot) {
            // have all the items here, add them all to the category
            var index = 0;
            querySnapshot.forEach(function(doc) {
                // for each doc (item) add the data
                onQuantityFound(table, index++, doc.id, doc.data());
            })
        },
        function(error) {
            console.log('failed to find the quantities in an item', error);
        });
}

function onQuantityFound(table, index, quantityId, quantityData) {
    // remember the data we got so we can change it
    quantityIdsSelected.push(quantityId);
    quantityDataSelected.push(quantityData);
    // add a row to the table
    var newRow = document.createElement('tr');
    newRow.id = quantityId;
    var tBody = table.getElementsByTagName('tbody')[0];
    // add the data to this row (make the quantity read only)
    addTableCell(newRow, quantityId + '_amt' + '_' + index, quantityData.quantity);//.getElementsByTagName('input')[0].setAttribute('readonly', 'true');
    addTableCell(newRow, quantityId + '_gbp' + '_' + index, quantityData.gbp_notes ? quantityData.gbp_notes : quantityData.gbp);
    addTableCell(newRow, quantityId + '_usd' + '_' + index, quantityData.usd_notes ? quantityData.usd_notes : quantityData.usd);
    addTableCell(newRow, quantityId + '_aud' + '_' + index, quantityData.aud_notes ? quantityData.aud_notes : quantityData.aud);
    addTableCell(newRow, quantityId + '_note' + '_' + index, quantityData.notes ? quantityData.notes : '');
    // and put the row into the table
    tBody.appendChild(newRow);
}

function addTableCell(row, cellId, cellData) {
    var dataElement = document.createElement('td');
    dataElement.innerHTML = '<input type="text" id="quantity_' + cellId + '_edit" value="' + cellData + '"/>';
    row.appendChild(dataElement);
    return dataElement;
}

function getPriceData(textValue) {
    if (typeof textValue != "string") return false // we only process strings!  
    if (!isNaN(textValue) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(textValue))) { // ...and ensure strings of whitespace fail
        // this is a number
        return parseFloat(textValue);
    } else {
        return null;
    }
}

function addNewQuantity() {
    // add a new quantity to the selected item and then add the row to the proper table
    if (!categoryIdSelected || !categoryDataSelected || !itemIdSelected || !itemDataSelected || !quantityIdsSelected || !quantityDataSelected) {
        alert('none selected');
    } else {
        // add the quantity
        var newData = firebaseData.defaultQuantity(itemIdSelected, itemDataSelected, -1, 0, "", 0, "", 0, "", "");
        firebaseData.addNewQuantity(newData, (newQuantityRef) => {
            // added the new one, add the row
            var table = document.getElementById('quantity_data_table');
            var newIndex = table.getElementsByTagName('tbody')[0].childNodes.length;
            onQuantityFound(table, newIndex, newQuantityRef.id, newData);
        }, (error) => {
            alert('Failed to add the new quantity ', error);
        });
    }
}

function onSave() {
    // save the data, put all the category data back into a new object to send to the database
    if (!categoryIdSelected || !categoryDataSelected || !itemIdSelected || !itemDataSelected) {
        alert('none selected');
    }
    else {
        // this works by default
        setDataChanged(false);
        // create the category data to send
        categoryDataSelected.name = getEditedData('category', 'name');
        categoryDataSelected.description = getEditedData('category', 'description');
        categoryDataSelected.notes = getEditedData('category', 'notes');
        categoryDataSelected.image = getEditedData('category', 'image');
        // and send it
        firebaseData.updateCategoryData(categoryIdSelected, categoryDataSelected,
            function() {
                // this worked
                console.log('category data saved');
            },
            function(error) {
                alert('sorry this failed to save the category data: ', error);
                setDataChanged(true);
            });

        // do the item data too
        itemDataSelected.name = getEditedData('item', 'name');
        itemDataSelected.quality = getEditedData('item', 'quality');
        itemDataSelected.description = getEditedData('item', 'description');
        itemDataSelected.category_name = categoryDataSelected.name;
        itemDataSelected.notes = getEditedData('item', 'notes');
        itemDataSelected.image = getEditedData('item', 'image');
        itemDataSelected.url = getEditedData('item', 'url');
        itemDataSelected.physical = getEditedData('item', 'physical');
        itemDataSelected.colours = getEditedData('item', 'colours');
        itemDataSelected.supplier = getEditedData('item', 'supplier');

        // and send it
        firebaseData.updateItemData(itemIdSelected, itemDataSelected,
            function() {
                // this worked
                console.log('item data saved');
            },
            function(error) {
                alert('sorry this failed to save the item data: ', error);
                setDataChanged(true);
            });

        // and the quantities
        for (var i = 0; i < quantityDataSelected.length; ++i) {
            // for each quantity, get the data from the HTML edit boxes
            var editedData = getEditedData('quantity', quantityIdsSelected[i] + '_amt_' + i);
            quantityDataSelected[i].quantity = getPriceData(editedData);
            // do the reference data too
            quantityDataSelected[i].category_name = categoryDataSelected.name;
            quantityDataSelected[i].item_name = itemDataSelected.name;
            quantityDataSelected[i].item_quality = itemDataSelected.quality;
            
            // if a number then take the price, else take it as notes on the price that would be
            editedData = getEditedData('quantity', quantityIdsSelected[i] + '_gbp_' + i);
            var editedPrice = getPriceData(editedData);
            if (editedPrice !== null) {
                quantityDataSelected[i].gbp = editedPrice;
                quantityDataSelected[i].gbp_notes = '';
            } else {
                quantityDataSelected[i].gbp = 0;
                quantityDataSelected[i].gbp_notes = editedData;
            }
            // have they entered a number for USD?
            editedData = getEditedData('quantity', quantityIdsSelected[i] + '_usd_' + i);
            editedPrice = getPriceData(editedData);
            if (editedPrice !== null) {
                quantityDataSelected[i].usd = editedPrice;
                quantityDataSelected[i].usd_notes = '';
            } else {
                quantityDataSelected[i].usd = 0;
                quantityDataSelected[i].usd_notes = editedData;
            }
            // have they entered a number for AUD?
            editedData = getEditedData('quantity', quantityIdsSelected[i] + '_aud_' + i);
            editedPrice = getPriceData(editedData);
            if (editedPrice !== null) {
                quantityDataSelected[i].aud = editedPrice;
                quantityDataSelected[i].aud_notes = '';
            } else {
                quantityDataSelected[i].aud = 0;
                quantityDataSelected[i].aud_notes = editedData;
            }
            // and the notes
            quantityDataSelected[i].notes = getEditedData('quantity', quantityIdsSelected[i] + '_note_' + i);
            // and send it
            firebaseData.updateQuantityData(quantityIdsSelected[i], quantityDataSelected[i],
                function() {
                    // this worked
                    console.log('quantity ' + i + ' data saved');
                },
                function(error) {
                    alert('sorry this failed to save the quantity data: ', error);
                    setDataChanged(true);
                });
        }
    }

    
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');

    const node = document.getElementById("search");
    node.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            onSubmitSearch();
        }
    });
});