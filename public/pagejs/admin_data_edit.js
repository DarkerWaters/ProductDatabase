// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

var categoriesFound;
var categoryIdSelected;
var categoryDataSelected;
var itemIdSelected;
var itemDataSelected;

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
    firebaseData.searchCollectionForWord(firebaseData.collectionCategories, searchTerm,
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
    itemIdSelected = itemId;;
    itemDataSelected = itemData;

    fillEdit('item', 'name', itemData.name);
    fillEdit('item', 'quality', itemData.quality);
    fillEdit('item', 'description', itemData.description);
    fillEdit('item', 'notes', itemData.notes);
    fillEdit('item', 'image', itemData.image);

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
    firebaseData.getQuantitiesInItem(itemId,
        function(querySnapshot) {
            // have all the items here, add them all to the category
            querySnapshot.forEach(function(doc) {
                // for each doc (item) add the data
                onQuantityFound(table, doc.id, doc.data());
            })
        },
        function(error) {
            console.log('failed to find the quantities in an item', error);
        });
}

function onQuantityFound(table, quantityId, quantityData) {
    // add a row to the table
    var newRow = document.createElement('tr');
    newRow.id = quantityId;
    var tBody = table.getElementsByTagName('tbody')[0];
    // add the data to this row
    addTableCell(newRow, quantityData.quantity);
    addTableCell(newRow, quantityData.gbp_notes ? quantityData.gbp_notes : '£' + quantityData.gbp);
    addTableCell(newRow, quantityData.usd_notes ? quantityData.usd_notes : '$' + quantityData.usd);
    addTableCell(newRow, quantityData.aud_notes ? quantityData.aud_notes : 'AUD ' + quantityData.aud);
    addTableCell(newRow, quantityData.notes ? quantityData.notes : '');
    // and put the row into the table
    tBody.appendChild(newRow);
}

function addTableCell(row, cellData) {
    var dataElement = document.createElement('td');
    dataElement.innerHTML = cellData;
    row.appendChild(dataElement);
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
        itemDataSelected.description = getEditedData('item', 'description');
        itemDataSelected.notes = getEditedData('item', 'notes');
        itemDataSelected.image = getEditedData('item', 'image');
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