# TwoFA in die eigene Webapp einbauen.
Um auf ihr Konto zuzugreifen, müssen Benutzer bei der Zwei-Faktor-Authentifizierung (TwoFA) zunächst ihre Login-Daten eingeben. In einem weiteren Schritt erhalten sie über ihr Mobiltelefon oder Tablet eine SMS, welche einen einmaligen Code enthält. Nach korrekter Eingabe beider Sicherheitsabfragen dürfen sich die User in ihren Account einloggen.

Als Entwickler einer WebApp können Sie nun den Registrierungs- und Loginprozess für die User durch TwoFA per SMS erweitern:
1)	Verifizierung: Im Registrierungsprozess erfolgt eine Überprüfung der vom User angegebenen Telefonnummer. Kann der User den einmalig erhaltenen Code eingeben, bestätigt er die Echtheit seiner eingetragenen Nummer. Sie können diesen Schritt auch überspringen, wenn Sie alle potenziellen Besucher und ihre jeweiligen Telefonnummern bereits durch andere Prozesse kennen.
2)	Authentifizierung: Im Anmeldeprozess wird eine Überprüfung der bereits verknüpften
Telefonnummer durchgeführt. Damit stellen Sie sicher, dass der User nach wie vor auf die
verknüpfte Telefonnummer zugreifen kann.

## 1) Beschaffung von Schlüsseln

Besorgen Sie sich den SiteKey und den SecretKey für die Domain Ihrer App. Eine ausführliche Anleitung finden Sie [hier](https://www.berlinsms.de/fuer-entwickler/dokumentation/sitekey-secretkey-generieren/). 

Stellen Sie ebenfalls den SiteKey und den SecretKey für Ihren Captcha-Provider bereit, wenn Sie wie oben beschrieben den Registrierungsprozess um TwoFA ergänzen möchten.

## 2) Verifizierung im Registrierungsprozess
Um die Verifizierung im Registrierungsprozess umzusetzen, benötigen Sie in Ihrem Anmeldeformular ein zusätzliches Feld für die Telefonnummer.

<div class="tabs">
<details open><summary>.html</summary>

``` { .html }
<form>
  <br/><label for="phonenumber">Phonenumber</label>
  <br/><input id="phonenumber" type="text"/>
  <br/><button id="submit" type="submit>Register</button>
</form>
```

</details>
</div>

Die Überprüfung der Rufnummer erfolgt bereits im Frontend. Fügen Sie dazu einen zusätzlichen Button "Verify" ein. Bearbeiten Sie das Klick-Event des Buttons, um zu verhindern, dass das Formular wie voreingestellt abgeschickt wird.

<div class="tabs">
<details open><summary>.html</summary>

```{ .html }
    <button id="verify"
        onclick="startVerify();return false;">Verify</button>
```

</details>
<details><summary>.jsx</summary>

```{ .jsx }
    <button id="verify" 
        onClick={(event)=>{event.preventDefault();startVerify();}}>Verify</button>
```

</details>
</div>

### SMS senden
Ein Klick auf den Button soll den Versand einer SMS an die eingegebene Rufnummer auslösen. Allerdings empfehlen wir Ihnen dringend, ein Captcha vorzuschalten. So schützen Sie sich vor Spam-Registrierungen, unnützem SMS-Versand und erheblichen Kosten. 

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    var js = document.createElement("script");
    js.type = 'text/javascript';
    js.src  = 'https://www.google.com/recaptcha/api.js';
    document.body.appendChild(js);
    
    const captchaDiv = document.createElement("div")
    captchaDiv.id = "captcha";
    captchaDiv.setAttribute('class', 'g-recaptcha')
    captchaDiv.setAttribute('data-sitekey', 'YOUR_CAPTCHA_SITE_KEY')
    captchaDiv.setAttribute('data-callback', 'sendCode'); //<-sendCode is the function to call after captcha is solved
    document.getElementById("register-form").appendChild(captchaDiv);
```

</details>
</div>

Nach Lösung des Captchas kann der User den SMS-Versand freischalten. Verwenden Sie dazu die Route "POST/twofa/sendsms".

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    function sendCode(captchaToken) {
        //make rest-call to sendCode
        const params = new URLSearchParams({
            twofaSitekey: "YOUR_TWOFA_SITE_KEY""", 
            captchaToken: captchaToken, 
            phonenumber: document.getElementById("phonenumber").value
        });
        const url = 'https://api.berlinsms.de/twofa/sendsms?' +
            params.toString();
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                requestCode(JSON.parse(this.responseText).challengeToken);//<-requestCode is the function to call after code is sent
            }
        };
        xhr.send();
    }
```

</details>
</div>

Speichern Sie den Challenge-Token zwischen, zum Beispiel in einem Hidden Input Ihres Formulars.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    challengeInput = document.createElement('input');
    challengeInput.id = 'challengeToken'; 
    challengeInput.setAttribute('type', 'hidden'); 
    challengeInput.setAttribute('name', 'challengeToken'); 
    challengeInput.setAttribute('value', challengeToken); 
    document.getElementById("register-form").appendChild(challengeInput);
```

</details>
</div>

Stellen Sie Ihren App-Benutzern ein Feld zur Verfügung, wo sie den erhaltenen Code aus der SMS eintragen können. Integrieren Sie in dieses Feld einen Event-Handler, um auf die Code-Eingabe zu reagieren.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    const codeInput = document.createElement("input")
    codeInput.id = "smsCode";
    codeInput.setAttribute('name', 'smsCode');
    codeInput.setAttribute('placeholder', 'smsCode');
    codeInput.addEventListener("input", codeEntered); 
    document.getElementById("register-form").appendChild(codeInput);
```

</details>
</div>

Sie können Ihren Benutzern einen Button zum Absenden des Codes bereitstellen oder nach Eingabe von 6 Zeichen die Überprüfung automatisch starten lassen.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    function codeEntered() {
        if (codeInput.value.length == 6) verifyCode();
    }
```

</details>
</div>

Um die eingetragene Zeichenfolge zu prüfen, verwenden Sie bitte die Route "PUT/twofa/preverifycode".

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    function verifyCode() {
        
        //hide code-input
        codeInput.style.visibility = 'hidden'; 

        //make rest-call to preverify code
        const params = new URLSearchParams({
            twofaSitekey: 'YOUR_TWOFA_SITE_KEY', 
            challengeToken: document.getElementById("challengeToken").value, 
            code: codeInput.value
        });
        const url = 'https://api.berlinsms.de/twofa/preverifycode?' + pa-rams.toString();
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                //Rest-Call successfull, challengge solved
            }
        };
        xhr.send();
    }
```

</details>
</div>
 
Sobald der Rest-Call zurückkehrt, können Sie den Registrierungsbutton freischalten.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    document.getElementById("submit").disabled = false;
```

</details>
</div>

Wenn der Benutzer nun auf den Registrierungsbutton klickt, wird das Formular abgeschickt und der User angelegt werden.

## 3) Überprüfung im Backend

Nach Abschicken des Formulars erhält das Backend den Challenge-Token. Da sich Daten im Frontend manipulieren lassen, empfehlen wir dringend den Challenge-Token auf Serverseite zu überprüfen. Verwenden Sie dazu die Route "PUT/twofa/verifycode".

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    $url = "https://api.berlinsms.de/twofa/challenge"
    . '?twofaSecretkey=YOUR_TWOFA_SECRET_KEY'
    . '&challengeToken=' . urlencode(stripslashes($challengeToken));

    $response = file_get_contents($url);
    $responseJson = json_decode($response, true);

    if (trim($responseJson['solved']) == true) {
        echo 'Phonenumber '. $responseJson['verifiedAddress'] . ' verified';
        //Add code to create user account here, assign the verified phonenumber
    }
    else {
        echo 'not verified';
    }
``` 

</details>
<details><summary>.js</summary>

``` { .js }
    var url = 'https://api.berlinsms.de/twofa/challenge'
            + '?twofaSecretkey=YOUR_TWOFA_SECRET_KEY'
            + '&challengeToken=' + encodeURIComponent(challengeToken);
    const fetch = await import('node-fetch');
	const response = await fetch.default(url);
    const responseJson = JSON.parse(await response.text());

    if (responseJson?.solved) {
        console.log( 'Phonenumber '+ responseJson.verifiedAddress + ' verified' );
        //Add code to create user account here, assign the verified phonenumber
    }
    else {
        console.log( 'not verified' );
    }
``` 

</details>
</div>

Sie können nun den Benutzer anlegen und die Telefonnummer verknüpfen. Bitte verwenden Sie dabei immer die zurückgegebene Nummer (verifiedAddress), um möglichen Manipulationen im Formular vorzubeugen.

## 4) Authentifizierung im Loginprozess

Um die Authentifizierung einer Telefonnummer im Loginprozess umzusetzen, fügen Sie nach der Überprüfung von Benutzername und Passwort eine weitere Sicherheitsabfrage hinzu: Ermitteln Sie zunächst die Telefonnummer des Benutzers, zum Beispiel aus Ihrer Datenbank. Versenden Sie anschließend einen Code per SMS an diese Nummer.

Verwenden Sie dazu die Route POST/twofa/sendsms.

Der Benutzer erhält nun per Kurzmitteilung einen Code an die von ihm angegebene Telefonnummer. Als Ergebnis bekommen Sie einen Json mit einem Challenge-Token.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    $url = "https://api.berlinsms.de/twofa/sendsms"
      . '?twofaSecretkey=TWOFA_SECRET_KEY'
      . '&phonenumber=' . $phonenumber;
    
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_HTTPHEADER => array('Content-type: application/json')
    ));
    $response = (string) curl_exec($ch);
    curl_close($ch);
    
    $responseJson = json_decode($response, true);
    $challengeToken = $responseJson["challengeToken"];
```

</details>

<details><summary>.js</summary>

``` { .js }
    url = 'https://api.berlinsms.de/twofa/sendsms'
        + '?twofaSecretkey=' + YOUR_TWOFA_SECRET_KEY
        + '&phonenumber=' + phonenumber;
    
    const fetch = await import('node-fetch');
    const response = await fetch.default(url, { method: 'POST' });

    const responseJson = JSON.parse(await response.text());
    challengeToken = responseJson.challengeToken;
``` 

</details>
</div>

Anschließend gibt der User den Code aus der Kurzmitteilung in einem von Ihnen bereitgestellten Formular ein. Zeitgleich erfolgt die Weitergabe des Challenge-Tokens als Hidden Input.

<div class="tabs">
<details open><summary>.html+.php</summary>

``` { .html }
    <form id="code-form" method="post" action="login.php">
        <input type="hidden" name="challengeToken" value="<?php echo $responseJson["challengeToken"]; ?>" />
        <br /><label for="code">Code</label>
        <br /><input id="code" name="code" placeholder="Code" type="number" size="6" oninput="codeEntered" />
        <br /><button id="submit" type="submit">Verify Code</button>
    </form>
```

</details>
</div>

Sie können nun den eingegebenen Code kontrollieren. 

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    $url = "https://api.berlinsms.de/twofa/preverifycode"
      . '?twofaSitekey='   . urlencode(stripslashes(TWOFA_SITE_KEY))
      . '&challengeToken=' . urlencode(stripslashes($_POST['challengeToken']))
      . '&code='           . urlencode(stripslashes($_POST['code']));

    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_HTTPHEADER => array('Content-type: application/json')
    ));
    $response = (string) curl_exec($ch);
    curl_close($ch);
```

</details>
<details><summary>.js</summary>

``` { .js }
    url = "https://api.berlinsms.de/twofa/preverifycode"
      + '?twofaSitekey='   . YOUR_TWOFA_SITE_KEY
      + '&challengeToken=' . challengeToken
      + '&code='           . code;
    
    const fetch = await import('node-fetch');
    const response = await fetch.default(url, { method: 'PUT' });
```

</details>
</div>

Fällt die Überprüfung erfolgreich aus, erhalten Sie im Response einen Json mit dem Wert "true" im Feld "solved" - Telefonnummer verifiziert.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$responseJson = json_decode($response, true);

	if (trim($responseJson['solved']) == true) {
		echo 'Phonenumber '. $responseJson['verifiedAddress'] . ' verified';
		//Add code to login user here
	}
	else {
		echo 'not verified';
	}
```

</details>
<details><summary>.js</summary>

``` { .js }
	const responseJson = JSON.parse(await response.text());
	if (responseJson.solved) {
		echo 'Phonenumber '. responseJson.verifiedAddress . ' verified';
		//Add code to login user here
	}
	else {
		echo 'not verified';
	}
```

</details>
</div>

Sie können den Benutzer nun einloggen. Den vollständigen Code dieses Tutorials finden Sie [hier](https://github.com/berlinSMS/twofa/tree/main/examples_without_modules) zum Download.