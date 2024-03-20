/** 
 * A js-widget for html-forms, to verify a phonenumber or a mailaddress
 *  - You need a Twofa-Optin API Key from https://twofa.berlinsms.de
 *
 * @copyright Copyright (c) 2023, Energieweise Ingenieur GmbH, berlinsms
 * @link      https://www.berlinsms.de/dokumentation/twofa-optin
 * 
 * Hiermit wird jeder Person, die eine Kopie dieser Software und der zugehoerigen
 * Dokumentationsdateien (die "Software") erwirbt, kostenlos die Erlaubnis erteilt, 
 * uneingeschraenkt mit der Software zu handeln, einschliesslich und ohne 
 * Einschraenkung der Rechte, Kopien der Software zu verwenden, zu kopieren, zu 
 * modifizieren, zusammenzufuehren, zu veroeffentlichen, zu vertreiben, zu 
 * unterlizenzieren und/oder zu verkaufen, und Personen, denen die Software zur 
 * Verfuegung gestellt wird, dies unter den folgenden Bedingungen zu gestatten:
 * 
 * Dieser Copyright-Hinweis und dieser Genehmigungshinweis muessen in allen Kopien 
 * oder wesentlichen Teilen der Software enthalten sein.
 * 
 * DIE SOFTWARE WIRD OHNE MAENGELGEWAEHR ZUR VERFUEGUNG GESTELLT, OHNE AUSDRUECKLICHE 
 * ODER STILLSCHWEIGENDE GEWAEHRLEISTUNG JEGLICHER ART, EINSCHLIESSLICH, ABER NICHT
 * BESCHRAENKT AUF DIE GEWAEHRLEISTUNG DER MARKTGAENGIGKEIT, DER EIGNUNG FUER EINEN 
 * BESTIMMTEN ZWECK UND DER NICHTVERLETZUNG VON RECHTEN. IN KEINEM FALL HAFTEN DIE 
 * AUTOREN ODER URHEBERRECHTSINHABER FUER JEGLICHE ANSPRUECHE, SCHAEDEN ODER SONSTIGE 
 * HAFTUNG, SEI ES DURCH VERTRAG, UNERLAUBTE HANDLUNGEN ODER ANDERWEITIG, DIE SICH 
 * AUS DER SOFTWARE ODER DER NUTZUNG DER SOFTWARE ODER DEM SONSTIGEN UMGANG MIT 
 * DER SOFTWARE ERGEBEN ODER DAMIT ZUSAMMENHAENGEN.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of 
 * this software and associated documentation files (the "Software"), to deal in 
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the 
 * Software, and to permit persons to whom the Software is furnished to do so, 
 * subject to the following conditions:
 * 
 * This copyright notice and this permission notice must be included in all copies 
 * or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR
 * IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIMS, DAMAGES OR OTHER LIABILITY, 
 * WHETHER IN CONTRACT, TORT OR OTHERWISE, ARISING OUT OF OR RELATED TO THE SOFTWARE 
 * OR THE USE OF OR OTHER DEALINGS WITH THE SOFTWARE.
 * 
 */
 
(async function () {

    //globals
    const twofaApi = 'https://api.berlinsms.de/twofa'; //   'http://localhost:3004/twofa'; //     
    const twofaStatic = 'https://static.berlinsms.de/twofa';

    const twofaTypes = {
        optinSms: 'optin(sms)',
        optinMail: 'optin(mail)',
    };

    const twofaStats = {
        loading: 'loading',
        serverUnavailable: 'server unavailable',
        sitekeyMissing: 'missing sitekey',
        sitekeyIncorrect: 'incorrect sitekey',
        addressEnter: 'enter valid address',
        addressEntered: 'valid address entered',
        captcha: 'captcha',
        captchaTypeIncorrect: 'captcha-type incorrect',
        codeSendRequested: 'code send requested',
        codeSendFailed: 'code send failed',
        codeSent: 'code sent',
        codeVerificationRequested: 'code verification requested',
        codeVerificationFailed: 'code verification failed',
        codeVerified: 'code verified',
        errorOccured: 'error occured'
    };

    const twofaViews = {
        captcha: 'captcha',
        error: 'error',
        wait: 'wait',
        address: 'address',
        code: 'code',
        content: 'content'
    };

    //Start the script
    const callbacks = defineGlobalCallbacks();
    const dom = buildHtml(callbacks);
    changeState(twofaStats.loading);
    const userData = await getUserData();
    const accountData = await getAccountData(userData.twofaSitekey);
    dom.addCaptcha(accountData.captchaType, accountData.captchaSitekey);
    changeState(twofaStats.addressEnter);

    var g_address;
    var g_challengeToken;

    return;

    /// <summary>
    /// Retrieves user data from the URL parameters.
    /// </summary>
    /// <returns>
    /// An object containing the user data.
    /// </returns>
    // Rewritten code with comments

    async function getUserData() {

        // Get the URL of the current script
        const scriptUrl = document.currentScript.src;

        // Create a new URLSearchParams object from the URL
        const urlParams = new URLSearchParams(scriptUrl.split('?')[1]);

        urlParams.getCaseInsensitive = getCaseInsensitive;

        return {
            twofaSitekey:      urlParams.getCaseInsensitive('twofaSitekey') || urlParams.getCaseInsensitive('bsmsSitekey'),
            onSolvedCallback:  urlParams.getCaseInsensitive('onSolve')      || urlParams.getCaseInsensitive('onSolved'),
            onLoadCallback:    urlParams.getCaseInsensitive('onLoad')       || urlParams.getCaseInsensitive('onLoaded'),
            onExpiredCallback: urlParams.getCaseInsensitive('onExpire')     || urlParams.getCaseInsensitive('onExpired'),
            onErrorCallback:   urlParams.getCaseInsensitive('onError')      || urlParams.getCaseInsensitive('onErrored')
        }

        function getCaseInsensitive(searchedKey) {
            const searchedKeyLower = searchedKey.toLowerCase();                // Loop through the URL parameters
            for (const [key, value] of this) {
                // Check if the lowercase version of the key matches the searched key
                if (key.toLowerCase() === searchedKeyLower) {                  // Return the value if a match is found
                    return value;
                }
            }
            // Return null if no match is found
            return null;
        }
    };

    /// <summary>
    /// Gets the two-factor authentication account data for the given sitekey.
    /// </summary>
    /// <returns>
    /// The two-factor authentication account data.
    /// </returns>
    async function getAccountData(twofaSitekey) {

        //check if userData.twofaSitekey is defined
        if (!twofaSitekey) {                                       //if not, change twofa state and throw error
            changeState(twofaStats.sitekeyMissing);
            if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
            throw 'twofaSitekey not defined';
        }

        //get twofa account data
        const accountData = await getTwofaAccount(twofaSitekey);
        if (!accountData.domains?.includes(window.location.hostname)) {
            changeState(twofaStats.sitekeyIncorrect);
            if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
            throw `Domain ${window.location.hostname} doesnt match twofaAccount.domains: ${accountData.domains}`;
        }

        return accountData;
    };

    //Rest-Calls
    function restCall(method = 'PUT', path = '/', data = {}) {
        return new Promise((resolve, reject) => {
            const params = new URLSearchParams(data);
            const url = twofaApi + path + '?' + params.toString();
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState != 4) {
                    return;
                }
                if (this.status < 200) {
                    changeState(twofaStats.serverUnavailable)
                    if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
                    reject(`twofa-Server nicht erreichbar (status=${this.status})`);
                    return;
                }
                if ([401, 404].includes(this.status) ) {
                    changeState(twofaStats.sitekeyIncorrect);
                    reject(twofaStats.sitekeyIncorrect);
                    return;
                }
                try {
                    console.log(`restCall: this.status == ${this.status}`);
                    const json = JSON.parse(this.responseText);
                    json.status = this.status;
                    resolve(json);
                }
                catch (e) {
                    changeState(twofaStats.errorOccured);
                    if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
                    console.log(`restCall JSON.parse(${this.responseText}) @ ${url}`);
                    reject(e);
                }
            };
            xhttp.open(method, url, true);
            xhttp.send();
        });
    };

    async function getTwofaAccount(twofaSitekey) {
        const twofaAccount = await restCall('GET', '/account', {
            twofaSitekey: twofaSitekey
        });

        if (twofaAccount.status == 200) {
            return twofaAccount;
        }

        changeState(twofaStats.errorOccured);
        if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
        throw twofaStats.errorOccured;
    }

    async function postTwofaSend(twofaSitekey, captchaToken, address) {
        if (accountData.twofaType == twofaTypes.optinSms) {
            return await postTwofaSendsms(twofaSitekey, captchaToken, address);
        }
        if (accountData.twofaType == twofaTypes.optinMail) {
            return await postTwofaSendmail(twofaSitekey, captchaToken, address);
        }
        return null;
    }

    async function postTwofaSendsms(twofaSitekey, captchaToken, phoneNumber) {
        const response = await restCall('POST', '/sendsms', {
            twofaSitekey: twofaSitekey,
            captchaToken: captchaToken,
            phonenumber: phoneNumber
        });

        if (response.status == 200) {
            return response;
        }

        changeState(twofaStats.errorOccured);
        if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
        throw twofaStats.errorOccured;
    }

    async function postTwofaSendmail(twofaSitekey, captchaToken, mailaddress) {
        const response = await restCall('POST', '/sendmail', {
            twofaSitekey: twofaSitekey,
            captchaToken: captchaToken,
            mailaddress: mailaddress
        });

        if (response.status == 200) {
            return response;
        }

        changeState(twofaStats.errorOccured);
        if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
        throw twofaStats.errorOccured;
    }

    async function putTwofaPreverifyCode(twofaSitekey, challengeToken, verificationCode) {
        const response = await restCall('PUT', '/preverifycode', {
            twofaSitekey: twofaSitekey,
            challengeToken: challengeToken,
            code: verificationCode
        });

        if (response.status == 403) {
            const limitAttempts = response.limitAttempts;
            if (limitAttempts > 1) {
                changeState(twofaStats.codeVerificationFailed, `Noch ${limitAttempts} Versuche`);
            }
            else if (limitAttempts == 1) {
                changeState(twofaStats.codeVerificationFailed, `Letzter Versuch`);
            }
            else {
                changeState(twofaStats.errorOccured, 'Keine weiteren Versuche');
            }
            throw twofaStats.codeVerificationFailed;
        }

        if (response.status == 200) {
            return response;
        }

        changeState(twofaStats.errorOccured);
        if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
        throw twofaStats.errorOccured;
    }

    function defineGlobalCallbacks() {

        const callbacks = {}
        
        callbacks.captchaOnLoad = 'bsmsCaptchaOnLoadCallback';
        window[callbacks.captchaOnLoad] = data => {
            console.log('->Event: ' + callbacks.captchaOnLoad);
            if (typeof window[userData.onLoadCallback] === 'function') window[userData.onLoadCallback]();
        };


        callbacks.captchaOnSolved = 'bsmsCaptchaOnSolvedCallback';
        window[callbacks.captchaOnSolved] = async data => {
            try {
                console.log('->Event: ' + callbacks.captchaOnSolved);
                const captchaToken = data;
                changeState(twofaStats.codeSendRequested);
                const response = await postTwofaSend(userData.twofaSitekey, captchaToken, g_address);
                g_challengeToken = response.challengeToken;
                changeState(twofaStats.codeSent);
            }
            catch (e) {
                console.log(e);
                console.log(e.message);
            }
        };


        callbacks.captchaOnExpired = 'bsmsCaptchaOnExpiredCallback';
        window[callbacks.captchaOnExpired] = () => {
            console.log('->Event: ' + callbacks.captchaOnExpired);
        };


        callbacks.captchaOnError = 'bsmsCaptchaOnErrorCallback';
        window[callbacks.captchaOnError] = () => {
            console.log('->Event: ' + callbacks.captchaOnError + '</p>');
            changeState(twofaStats.captcha);
            if (typeof window[userData.onErrorCallback] === 'function') window[userData.onErrorCallback]();
        };


        callbacks.twofaAddressChanged = 'bsmsTwofaAddressChanged';
        window[callbacks.twofaAddressChanged] = event => {
            return changeState(
                repareAddress(event.target.value)
                    ? twofaStats.addressEntered
                    : twofaStats.addressEnter
            );
        }


        callbacks.twofaAddressKeydown = 'bsmsTwofaAddressKeydown';
        window[callbacks.twofaAddressKeydown] = event => {
            if (event.keyCode != 13) return window[callbacks.twofaAddressChanged](event);
            event.preventDefault();
            const button = dom.addressDiv.querySelector('.bsmstwofa-code-request');
            if (!button) return;
            var visibility = window.getComputedStyle(button).getPropertyValue("display");
            if (!visibility) return;
            if ('block'==visibility) button.click();
        }

        
        callbacks.twofaSendCode = 'bsmsTwofaSendCode';
        window[callbacks.twofaSendCode] = () => {
            const addressInput = dom.addressDiv.querySelector('.bsmstwofa-address-input');
            g_address = repareAddress(addressInput.value);
            changeState(twofaStats.captcha);
        }


        const repareAddress = address => {
            if (accountData.twofaType == twofaTypes.optinSms) {
                return reparePhonenumber(address);
            }
            if (accountData.twofaType == twofaTypes.optinMail) {
                return repareMailaddress(address);
            }
	        return null;
        };


        const reparePhonenumber = phonenumber => {

            phonenumber = phonenumber.replace(/\(0\)/g, '').replace(/[^\d\+]/g, '');

            if (!phonenumber.match(/^(\+|00)/)) {
                if (phonenumber.substr(0, 2) == '01') { phonenumber = '49' + phonenumber.slice(1); }
                if (phonenumber.substr(0, 2) == '15') { phonenumber = '49' + phonenumber; }
                if (phonenumber.substr(0, 2) == '16') { phonenumber = '49' + phonenumber; }
                if (phonenumber.substr(0, 2) == '17') { phonenumber = '49' + phonenumber; }
                if (phonenumber.substr(0, 2) == '06') { phonenumber = '43' + phonenumber.slice(1); }
                if (phonenumber.substr(0, 2) == '60') { phonenumber = '43' + phonenumber; }
                if (phonenumber.substr(0, 2) == '65') { phonenumber = '43' + phonenumber; }
                if (phonenumber.substr(0, 2) == '66') { phonenumber = '43' + phonenumber; }
                if (phonenumber.substr(0, 2) == '67') { phonenumber = '43' + phonenumber; }
                if (phonenumber.substr(0, 2) == '68') { phonenumber = '43' + phonenumber; }
            }

            phonenumber = phonenumber.replace(/\+/g, '').replace(/^0/, '');
            if (phonenumber.length < 12 || phonenumber.length > 14) {
                return null;
            }
            return phonenumber;
        };


        const repareMailaddress = mailaddress => {

            // Extract clear text name (if present)
            const nameStartIndex = mailaddress.indexOf('"');
            const nameEndIndex = mailaddress.lastIndexOf('"');
            if (nameStartIndex !== -1 && nameEndIndex !== -1 && nameStartIndex < nameEndIndex) {
                mailaddress = mailaddress.slice(nameEndIndex + 1);
            }

            const adressStartIndex = mailaddress.indexOf('<');
            const adressEndIndex = mailaddress.lastIndexOf('>');
            if (adressStartIndex !== -1 && adressEndIndex !== -1 && adressStartIndex < adressEndIndex) {
                mailaddress = mailaddress.slice(adressStartIndex + 1, adressEndIndex);
            }

            // Remove any remaining quotes and angle brackets around the mailaddress address 
            mailaddress = mailaddress.replace(/^['"<>\s]*|['"<>\s]*$/g, '');

            // Extract local and domain parts
            const atIndex = mailaddress.lastIndexOf('@');
            if (atIndex < 1 || mailaddress.length < 3) {
                return null;
            }

            const localPart = mailaddress.slice(0, atIndex);
            const domainPart = mailaddress.slice(atIndex + 1);
            if (localPart.length < 3 || domainPart.length < 3) {
                return null;
            }

            // return local-part and domain recombined
            return localPart + '@' + domainPart.toLowerCase();
        };


        callbacks.twofaDigitKeydown = 'bsmsTwofaDigitKeydown';
        window[callbacks.twofaDigitKeydown] = event => {
            if (event.keyCode == 13) return event.preventDefault();
            const previousInput = event.target.previousElementSibling;
            if (!previousInput) return;
            if ('Backspace' != event.key) return;
            if ('text' != previousInput.type) return;
            previousInput.focus();
        }


        callbacks.twofaDigitFocused = 'bsmsTwofaDigitFocused';
        window[callbacks.twofaDigitFocused] = event => {
            event.target.select();
        }

        
        callbacks.twofaDigitEntered = 'bsmsTwofaDigitEntered';
        window[callbacks.twofaDigitEntered] = event => {
            digitEntered(event.target);

            function digitEntered(target) {
                const value = target.value;
                if (value.length <= 0) return;

                const result = value.match(/\D*(\d)(.*)/);
                if (result == null) { target.value = ''; return; }

                const firstDigit = result[1];
                if (firstDigit.length <= 0) return;

                const nextInput = target.nextElementSibling;

                if (firstDigit != value) {
                    target.value = firstDigit;
                    if ('text' == nextInput.type) {
                        nextInput.value = result[2];
                        digitEntered(nextInput);
                        return;
                    }
                }

                if ('text' == nextInput.type) {
                    nextInput.focus();
                } else {
                    const button = dom.codeDiv.querySelector('.bsmstwofa-code-verify');
                    if (button) button.click();
                }
            }
        }


        callbacks.twofaVerifyCode = 'bsmsTwofaVerifyCode';
        window[callbacks.twofaVerifyCode] = async () => {
            try {
                const verificationCode = getCodeFromContentDiv();
                changeState(twofaStats.codeVerificationRequested);
                await putTwofaPreverifyCode(userData.twofaSitekey, g_challengeToken, verificationCode)

                changeState(twofaStats.codeVerified);
                if (typeof window[userData.onSolvedCallback] === 'function') window[userData.onSolvedCallback]();
            }
            catch (e) { }

            function getCodeFromContentDiv() {
                return Array.from(dom.codeDiv.querySelectorAll('.bsmstwofa-code-digit'))
                    .map(input => input.value)
                    .reduce((accumulator, currentValue) => accumulator + currentValue);
            }
        }

        return callbacks;
    }


    function buildHtml() {

        const dom = {};
        const divId = 'bstwofa' + Math.random().toString().substr(2);
        document.write(`<div id="${divId}" class="bsmstwofa-main" />`);
        dom.containerDiv = document.getElementById(divId);

        //Append styles
        const styles = document.createElement('link');
        styles.rel = 'stylesheet';
        styles.href = twofaStatic + '/twofa-optin.css';
        document.head.appendChild(styles);

        //captcha
        dom.captchaDiv = document.createElement('div');
        dom.captchaDiv.classList.add('g-recaptcha');
        dom.captchaDiv.classList.add('bsmstwofa-captcha-container'); 
        //dom.captchaDiv.setAttribute('data-onload-callback', callbacks.captchaOnLoad);
        dom.captchaDiv.setAttribute('data-callback', callbacks.captchaOnSolved);
        dom.captchaDiv.setAttribute('data-expired-callback', callbacks.captchaOnExpired);
        dom.captchaDiv.setAttribute('data-error-callback', callbacks.captchaOnError);
        dom.captchaDiv.innerHTML = 'C A P T C H A';
        dom.containerDiv.appendChild(dom.captchaDiv);

        //twofa
        dom.twofaDiv = document.createElement('div');
        dom.twofaDiv.classList.add('bsmstwofa-twofa-container');
        dom.containerDiv.appendChild(dom.twofaDiv);

        //logo
        dom.logoDiv = document.createElement('div');
        dom.logoDiv.classList.add('bsmstwofa-logo');
        dom.twofaDiv.appendChild(dom.logoDiv);

        //title
        dom.titleDiv = document.createElement('div');
        dom.titleDiv.classList.add('bsmstwofa-title');
        dom.titleDiv.innerHTML = 'TWOFA-OPTIN';
        dom.twofaDiv.appendChild(dom.titleDiv);

        //footer
        dom.footerDiv = document.createElement('div');
        dom.footerDiv.classList.add('bsmstwofa-footer');
        dom.footerDiv.innerHTML = `<a
            href="https://www.berlinsms.de/datenschutz" target="_blank">Datenschutzerklärung</a> - <a
            href="https://www.berlinsms.de/twofa-nutzungsbedingungen/" target="_blank">Nutzungsbedingungen</a>`;
        dom.twofaDiv.appendChild(dom.footerDiv);

        //error
        dom.errorDiv = document.createElement('div');
        dom.errorDiv.classList.add('bsmstwofa-error');
        dom.errorDiv.innerHTML = 'error';
        dom.twofaDiv.appendChild(dom.errorDiv);

        //code
        dom.waitDiv = document.createElement('div');
        dom.waitDiv.className = 'bsmstwofa-wait';
        dom.waitDiv.innerHTML = `<span class="bsmstwofa-wait-text">Loading</span>`;
        dom.twofaDiv.appendChild(dom.waitDiv);

        //address
        dom.addressDiv = document.createElement('div');
        dom.addressDiv.classList.add('bsmstwofa-address');
        dom.addressDiv.innerHTML = `<span class="bsmstwofa-address-text">Bitte Telefonnummer eingeben</span>
                <br><input class="bsmstwofa-address-input" oninput="window['${callbacks.twofaAddressChanged}'](event)" onkeydown="window['${callbacks.twofaAddressKeydown}'](event)" />
                <br><button class="bsmstwofa-code-request" type="button" onClick="window['${callbacks.twofaSendCode}']()">Code senden</button>`;
        dom.twofaDiv.appendChild(dom.addressDiv);

        //code
        dom.codeDiv = document.createElement('div');
        dom.codeDiv.classList.add('bsmstwofa-code');
        dom.codeDiv.innerHTML = `
                <span class="bsmstwofa-code-text">Geben Sie den Code hier ein</span><br>
                <input class="bsmstwofa-code-digit" oninput="window['${callbacks.twofaDigitEntered}'](event)" onfocus="window['${callbacks.twofaDigitFocused}'](event)" onkeydown="window['${callbacks.twofaDigitKeydown}'](event)" />
                <input class="bsmstwofa-code-digit" oninput="window['${callbacks.twofaDigitEntered}'](event)" onfocus="window['${callbacks.twofaDigitFocused}'](event)" onkeydown="window['${callbacks.twofaDigitKeydown}'](event)" />
                <input class="bsmstwofa-code-digit" oninput="window['${callbacks.twofaDigitEntered}'](event)" onfocus="window['${callbacks.twofaDigitFocused}'](event)" onkeydown="window['${callbacks.twofaDigitKeydown}'](event)" />
                <input class="bsmstwofa-code-digit" oninput="window['${callbacks.twofaDigitEntered}'](event)" onfocus="window['${callbacks.twofaDigitFocused}'](event)" onkeydown="window['${callbacks.twofaDigitKeydown}'](event)" />
                <input class="bsmstwofa-code-digit" oninput="window['${callbacks.twofaDigitEntered}'](event)" onfocus="window['${callbacks.twofaDigitFocused}'](event)" onkeydown="window['${callbacks.twofaDigitKeydown}'](event)" />
                <input class="bsmstwofa-code-digit" oninput="window['${callbacks.twofaDigitEntered}'](event)" onfocus="window['${callbacks.twofaDigitFocused}'](event)" onkeydown="window['${callbacks.twofaDigitKeydown}'](event)" />
                <br>
                <button class="bsmstwofa-code-verify" type="button" onClick="window['${callbacks.twofaVerifyCode}']()">Überprüfen</button>`;
        dom.twofaDiv.appendChild(dom.codeDiv);

        //content
        dom.contentDiv = document.createElement('div');
        dom.contentDiv.classList.add('bsmstwofa-content');
        dom.contentDiv.innerHTML = 'content';
        dom.twofaDiv.appendChild(dom.contentDiv);

        dom.addCaptcha = addCaptcha;

        return dom;

        function addCaptcha(captchaType, captchaSitekey) {

            dom.captchaDiv.setAttribute('data-sitekey', captchaSitekey);
            const script = document.createElement('script');
            if ('reCaptcha'.toLowerCase() == captchaType.toLowerCase()) {
                script.src = `https://www.google.com/recaptcha/api.js?onload=${callbacks.captchaOnLoad}`;
            }
            else if ('hCaptcha'.toLowerCase() == captchaType.toLowerCase()) {
                script.src = `https://js.hcaptcha.com/1/api.js?onload=${callbacks.captchaOnLoad}`;
            }
            else {
                changeState(twofaStats.captchaTypeIncorrect);
                throw `captchaType '${captchaType}' incorrect`;
            }

            document.head.appendChild(script);

        }
    }

    //variations of the twofa-frameElement
    function changeState(newTwofaState, text='') {

        if (twofaStats.loading == newTwofaState) {
            dom.waitDiv.querySelector('.bsmstwofa-wait-text').innerHTML = `Loading..`;
            view(twofaViews.wait);
        }
        else if (twofaStats.errorOccured == newTwofaState) {
            dom.errorDiv.innerHTML = text || 'An error occured';
            view(twofaViews.error);
        }
        else if (twofaStats.serverUnavailable == newTwofaState) {
            dom.errorDiv.innerHTML = 'Hinweis an den Seitenbetreiber:<br>Twofa-Server nicht erreichbar';
            view(twofaViews.error);
        }
        else if (twofaStats.sitekeyMissing == newTwofaState) {
            dom.errorDiv.innerHTML = 'Hinweis an den Seitenbetreiber:<br>Sitekey wurde nicht angegeben';
            view(twofaViews.error);
        }
        else if (twofaStats.sitekeyIncorrect == newTwofaState) {
            dom.errorDiv.innerHTML = 'Hinweis an den Seitenbetreiber:<br>Sitekey nicht korrekt';
            view(twofaViews.error);
        }
        else if (twofaStats.captchaTypeIncorrect == newTwofaState) {
            dom.errorDiv.innerHTML = 'Hinweis an den Seitenbetreiber:<br>captcha-type incorrect';
            view(twofaViews.error);
        }
        else if (twofaStats.addressEnter == newTwofaState) {
            view(twofaViews.address);
            const text = accountData.twofaType == twofaTypes.optinSms 
                ? `Bitte Telefonnummer eingeben`
                : `Bitte Email-Adresse eingeben`;
            dom.addressDiv.querySelector('.bsmstwofa-address-text').innerHTML = text;
            dom.addressDiv.querySelector('.bsmstwofa-address-input').focus();
            dom.addressDiv.querySelector('.bsmstwofa-code-request').style.display = 'none';
        }
        else if (twofaStats.addressEntered == newTwofaState) {
            view(twofaViews.address);
            dom.addressDiv.querySelector('.bsmstwofa-address-text').innerHTML = `Wir senden einen Code an`;
            dom.addressDiv.querySelector('.bsmstwofa-address-input').focus();
            dom.addressDiv.querySelector('.bsmstwofa-code-request').style.display = 'block';
        }
        else if (twofaStats.captcha == newTwofaState) {
            view(twofaViews.captcha);
        }
        else if (twofaStats.codeSendRequested == newTwofaState) {
            dom.waitDiv.querySelector('.bsmstwofa-wait-text').innerHTML = `Code Send Requested`;
            view(twofaViews.wait);
        }
        else if (twofaStats.codeSendFailed == newTwofaState) {
            dom.contentDiv.innerHTML = `Code Send Failed`;
            view(twofaViews.content);
        }
        else if (twofaStats.codeSent == newTwofaState) {
            view(twofaViews.code);
            dom.codeDiv.querySelector('.bsmstwofa-code-text').innerHTML = `Geben Sie den Code hier ein`;
            dom.codeDiv.querySelector('.bsmstwofa-code-digit').focus();
        }
        else if (twofaStats.codeVerificationRequested == newTwofaState) {
            dom.waitDiv.querySelector('.bsmstwofa-wait-text').innerHTML = `Code Verification Requested`;
            view(twofaViews.wait);
        }
        else if (twofaStats.codeVerificationFailed == newTwofaState) {
            view(twofaViews.code);
            dom.codeDiv.querySelector('.bsmstwofa-code-text').innerHTML = text || `Code Verification Failed`;
            dom.codeDiv.querySelector('.bsmstwofa-code-digit').focus();
        }
        else if (twofaStats.codeVerified == newTwofaState) {
            dom.contentDiv.innerHTML = `<br> &nbsp; &nbsp; <b>${g_address}</b><br>
			    Verified
			    <input type="hidden" name="challengeToken" value="${g_challengeToken}"/>
			    <input type="hidden" name="address" value="${g_address}"/>`;
            view(twofaViews.content);
        }
        else {
            dom.errorDiv.innerHTML = `Hinweis an den Seitenbetreiber:<br>Fehlerhaftes Script<br>${newTwofaState}`;
            view(twofaViews.error);
        }
        return;

        function view(view, text = '') {
            dom.captchaDiv.style.display = (twofaViews.captcha == view ? 'block' : 'none');
            dom.twofaDiv.style.display   = (twofaViews.captcha != view ? 'block' : 'none');

            dom.errorDiv.style.display   = (twofaViews.error   == view ? 'block' : 'none');
            dom.addressDiv.style.display = (twofaViews.address == view ? 'block' : 'none');
            dom.waitDiv.style.display    = (twofaViews.wait    == view ? 'block' : 'none');
            dom.codeDiv.style.display    = (twofaViews.code    == view ? 'block' : 'none');
            dom.contentDiv.style.display = (twofaViews.content == view ? 'block' : 'none');
        }
    }

})().catch(e => { console.log('Twofa: global Exception'); console.log(e);});