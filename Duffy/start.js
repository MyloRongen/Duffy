{
    var myValue = document.getElementById(textbox).value;
    return myValue;
}

//Get's a nummeric value from an element by id and returns this
function getValueTekstBox(textbox)
{
    var myValue = document.getElementById(textbox).value;
    if (!isNaN(myValue))
    {
        return myValue;
    }
    else
    {
        alert("The value inserted is not a valud value, use only numbers and one .");
    }
}


function myCodeFunction(){
    var inhoud = getValueTekstBox("textboxCode3");

    switch(true)
    {
        case (inhoud == "STARTING"):
            alert("starting....")
            window.location.href = "index.html";         
        break;
        default:
            alert("Fout antwoord")
        break;
    }
}