
# TwoFA in die eigene Webapp einbauen.

Um auf ihr Konto zuzugreifen, müssen Benutzer bei der Zwei-Faktor-Authentifizierung (TwoFA) zunächst ihre Login-Daten eingeben. In einem weiteren Schritt erhalten sie über ihr Mobiltelefon oder Tablet eine SMS, welche einen einmaligen Code enthält. Nach korrekter Eingabe beider Sicherheitsabfragen dürfen sich die User in ihren Account einloggen.

Als Entwickler einer WebApp können Sie nun den Registrierungs- und Loginprozess für die User durch TwoFA per SMS erweitern:
1)	Verifizierung: Im Registrierungsprozess erfolgt eine Überprüfung der vom User angegebenen Telefonnummer. Kann der User den einmalig erhaltenen Code eingeben, bestätigt er die Echtheit seiner eingetragenen Nummer. Sie können diesen Schritt auch überspringen, wenn Sie alle potenziellen Besucher und ihre jeweiligen Telefonnummern bereits durch andere Prozesse kennen.
2)	Authentifizierung: Im Anmeldeprozess wird eine Überprüfung der bereits verknüpften Telefonnummer durchgeführt. Damit stellen Sie sicher, dass der User nach wie vor auf die verknüpfte Telefonnummer zugreifen kann.
		
## 1) Beschaffung von Schlüsseln

Besorgen Sie sich den SiteKey und den SecretKey für die Domain Ihrer App. Eine ausführliche Anleitung finden Sie [hier](https://www.berlinsms.de/fuer-entwickler/dokumentation/sitekey-secretkey-generieren/). 

Stellen Sie ebenfalls den SiteKey und den SecretKey für Ihren Captcha-Provider bereit, wenn Sie wie oben beschrieben den Registrierungsprozess um TwoFA ergänzen möchten.

## 2) Verifizierung im Registrierungsprozess

Um die Verifizierung im Registrierungsprozess umzusetzen, benötigen Sie in Ihrem Anmeldeformular ein zusätzliches Feld für die Telefonnummer. Fügen Sie dazu vor dem Submit-Button das js-Modul "twofa-optin.js" ein und ergänzen Sie den Parameter SiteKey, den Sie in Schritt 1 erhalten haben.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    <script src="https://static.berlinsms.de/twofa/twofa-optin.js?bsmsSitekey=<?php echo TWOFA_SITE_KEY; ?>&onSolved=onSolvedCallback"></script>
```

</details>
</div>

Das Modul bietet ein Eingabefeld für die Telefonnummern und übernimmt im Frontend die Überprüfung der Angaben. Außerdem fügt es dem Formular einen Hidden Input mit einem Challenge-Token hinzu. Erst nach korrekter Eingabe des per SMS versendeten Codes erscheint ein freigeschalteter Registrierungsbutton. Optional können Sie einen Callback ergänzen, der ebenfalls erst nach Bestätigung des Codes aufgerufen wird.

<div class="tabs">
<details open><summary>.js</summary>

``` { .js }
	<script language="javascript">
		function onSolvedCallback() {
			document.getElementById("submit").disabled = false;
		}
	</script>
```

</details>
</div>

Wenn der Benutzer nun auf den Registrierungsbutton klickt, wird das Formular abgeschickt und der Benutzer kann registriert werden.

## 3) Überprüfung im Backend

Nach Abschicken des Formulars erhält das Backend den Challenge-Token. Da sich Daten im Frontend manipulieren lassen, empfehlen wir dringend den Challenge-Token auf Serverseite zu überprüfen. Verwenden Sie dazu das Modul "Twofa", welches Sie [hier](https://static.berlinsms.de/twofa/twofa.zip)  herunterladen können. Speichern Sie das Modul in Ihrem Webspace und importieren Sie es in Ihren Code im Backend.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	include '../twofa.php';
```

</details>
</div>

Erzeugen Sie eine Instanz der Klasse "Twofa", wobei Sie SiteKey und SecretKey an den Konstruktor übergeben.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$twofa = new Twofa( TWOFA_SITE_KEY, TWOFA_SECRET_KEY );
```

</details>
</div>

Laden Sie die Challenge-Informationen über die Memberfunction "getTwofaChallenge". Diese Funktion erwartet den Challenge-Token als Parameter.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$twofaChallenge = $twofa->getTwofaChallenge($_POST['challengeToken']);
```

</details>
</div>

Das zurückgegebene Objekt enthält im Parameter "solved" die verifizierte Telefonnummer sowie die Information, ob die Challenge erfolgreich gelöst wurde.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	if ($twofaChallenge->hasError()) {
		echo 'Error: ' . $twofaChallenge->getError();

	} else if (!$twofaChallenge->isSolved()) {
		echo "<hr>twofa verification failed";

	} else {
		echo "<hr>twofa verifcation successful <br>" . $twofaChallenge->getVerifiedAddress() . " is the verified phone number";
	}
```

</details>
</div>

Sie können nun den Benutzer anlegen und die Telefonnummer verknüpfen. Bitte denken Sie daran, nur die zurückgegebene Telefonnummer zu verwenden. Im Frontend bzw. im Formular eingetragene Telefonnummern lassen sich manipulieren.

## 4) Authentifizierung im Loginprozess

Um die Authentifizierung einer Telefonnummer im Loginprozess umzusetzen, fügen Sie nach der Überprüfung von Benutzername und Passwort eine weitere Sicherheitsabfrage hinzu: Ermitteln Sie zunächst die Telefonnummer des Benutzers, zum Beispiel aus Ihrer Datenbank. Versenden Sie anschließend einen Code per SMS an diese Nummer.

Verwenden Sie dazu wieder das Modul "Twofa". Falls noch nicht geschehen, können Sie es [hier](https://static.berlinsms.de/twofa/twofa.zip) herunterladen. Speichern Sie das Modul in Ihren Webspace, importieren Sie es in Ihren Code im Backend und erzeugen Sie eine Instanz der Klasse "Twofa". Dabei übergeben Sie den Sitekey und den SecretKey an den Konstruktor.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	include '../twofa.php';
	$twofa = new Twofa( TWOFA_SITE_KEY, TWOFA_SECRET_KEY );
```

</details>
</div>

Den Verifikationsprozess starten Sie mit der Memberfunction "postTwofaSendsms". Diese Funktion erwartet die zu prüfende Telefonnummer.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$postTwofaSendsmsResponse = $twofa->postTwofaSendsms($phonenumber);
```

</details>
</div>

Der Benutzer erhält nun per SMS einen Code an die von ihm angegebene Telefonnummer. Als Ergebnis bekommen Sie ein Objekt mit einem Challenge-Token.

Anschließend gibt der User den Code aus der Kurzmitteilung in einem von Ihnen bereitgestellten Formular ein. Zeitgleich erfolgt die Weitergabe des Challenge-Tokens als Hidden Input.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    <form id="code-form" method="post" action="login.php">
        <input type="hidden" name="challengeToken" value="<?php echo $postTwofaSendsmsResponse->getChallengeToken(); ?>" />
        <br /><label for="code">Code</label>
        <br /><input id="code" name="code" placeholder="Code" type="number" size="6" oninput="codeEntered" />
        <br /><button id="submit" type="submit">Verify Code</button>
    </form>
```

</details>
</div>

Nun können Sie mit Hilfe der Memberfunction "putTwofaPreverifycode" überprüfen, ob beide Parameter - Benutzerangaben und Challenge-Token - übereinstimmen.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$twofaChallenge = $twofa->putTwofaPreverifycode($_POST['challengeToken'], $_POST['code']);
```

</details>
</div>

Das zurückgegebene Objekt enthält die verifizierte Telefonnummer und den Parameter "solved". Dieser beinhaltet die Information, ob die Challenge erfolgreich gelöst werden konnte oder nicht.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	if ($twofaChallenge->hasError()) {
        echo 'Error: ' . $twofaChallenge->getError();

    } else if ($twofaChallenge->getSolved()) {
        echo 'Succesfully login as ' . $twofaChallenge->getVerifiedAddress();

    } else {
        echo 'Login failed, not verified: ' . $twofaChallenge->getError();

    }
```

</details>
</div>

Sie k&ouml;nnen nun den Benutzer einloggen.

Sie finden den vollst&auml;ndigen Code dieses Tutorials zum Download [hier](https://static.berlinsms.de/twofa/twofa_with_modules.zip)