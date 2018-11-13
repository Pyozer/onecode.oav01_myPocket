function ajaxFromRequest(url, formId, resultIdDiv) {
    const resultDiv = document.getElementById(resultIdDiv)
    resultDiv.style.visibility = 'hidden'

    const submitBtn = document.querySelector('input[type=submit]')
    submitBtn.setAttribute('disabled', 'true')

    const xmlhttp = new XMLHttpRequest()
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            const data = JSON.parse(xmlhttp.responseText)

            if (data.status == "success") {
                resultDiv.className = "has-text-success"
            } else {
                resultDiv.className = "has-text-danger"
                submitBtn.removeAttribute('disabled')
            }

            resultDiv.innerHTML = data.message
            resultDiv.style.visibility = 'visible'

            if (data.redirect)
                setTimeout(() => {
                    window.location.replace(data.redirect);
                }, 500)
        }
    }

    xmlhttp.open("POST", url, true)
    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')

    const form = document.getElementById(formId)
    const postData = Array.from(new FormData(form), e => e.map(encodeURIComponent).join('=')).join('&')
    xmlhttp.send(postData)
}

function logout() {
    const xmlhttp = new XMLHttpRequest()
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            const data = JSON.parse(xmlhttp.responseText)

            if (data.redirect)
                setTimeout(() => {
                    window.location.replace(data.redirect);
                }, 500)
        }
    }

    xmlhttp.open("GET", '/logout')
    xmlhttp.send()
}