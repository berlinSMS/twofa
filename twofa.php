<?php
/**
 * A php-library to verify and authenticate a phonenumber via sms
 *  - You need a Twofa API Key from https://twofa.berlinsms.de
 *
 * @copyright Copyright (c) 2024, Energieweise Ingenieur GmbH, berlinsms
 * @link      https://www.berlinsms.de/twofa
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


/**
 * TwofaResponse
 */
class TwofaResponse
{
    private $error;

    /**
     * Constructor.
     *
     * @param string $error.
     */
    function __construct($_error = '')
    {
        $this->TwofaResponse($_error);
    }
    function TwofaResponse($_error = '')
    {
        $this->error = $_error;
    }

    /**
     * @return string
     */
    function hasError(): string
    {
        return strlen(trim($this->error)) > 0;
    }

    /**
     * @return string
     */
    function getError(): string
    {
        return $this->error;
    }

    /**
     * @param string $error
     * @return TwofaResponse
     */
    function setError(string $error): self
    {
        $this->error = $error;
        return $this;
    }
}


/**
 * TwofaSendResponse
 */
class TwofaSendResponse extends TwofaResponse
{
    private $challengeToken = '';

    /**
     * @return string
     */
    function getChallengeToken(): string
    {
        return $this->challengeToken;
    }

    /**
     * @param string $challengeToken
     * @return TwofaSendResponse
     */
    function setChallengeToken(string $challengeToken): self
    {
        $this->challengeToken = trim($challengeToken);
        return $this;
    }
}


/**
 * PostTwofaSendsmsResponse
 */
class PostTwofaSendsmsResponse extends TwofaSendResponse{}


/**
 * PostTwofaSendmailResponse
 */
class PostTwofaSendmailResponse extends TwofaSendResponse{}


/**
 * TwofaChallengeResponse
 */
class TwofaChallengeResponse extends TwofaResponse
{
    private $solved;
    private $verifiedAddress;


    /**
     * @return bool
     */
    function getSolved(): bool
    {
        return $this->solved || false;
    }


    /**
     * @return bool
     */
    function isSolved(): bool
    {
        return $this->solved || false;
    }

    /**
     * @param bool $solved
     * @return TwofaChallengeResponse
     */
    function setSolved(bool $solved): self
    {
        $this->solved = $solved;
        return $this;
    }

    /**
     * @return string
     */
    function getVerifiedAddress(): string
    {
        return $this->verifiedAddress;
    }

    /**
     * @param string $verifiedAddress
     * @return TwofaChallengeResponse
     */
    function setVerifiedAddress(string $verifiedAddress): self
    {
        $this->verifiedAddress = trim($verifiedAddress);
        return $this;
    }
}



/**
 * PutTwofaPreverifycodeResponse
 */
class PutTwofaPreverifycodeResponse extends TwofaChallengeResponse{}


/**
 * GetTwofaChallengeResponse
 */
class GetTwofaChallengeResponse extends TwofaChallengeResponse{}

class Twofa
{
    private static $_getSecretUrl = 'https://twofa.berlinsms.de';
    private static $_urlTwofaApi = 'https://api.berlinsms.de/twofa'; // 'http://127.0.0.1:3004/twofa';  //
    private $_twofaSitekey;
    private $_twofaSecretkey;
    private $_debug;

    /**
     * Constructor.
     *
     * @param string $twofaSitekey
     * @param string $twofaSecretkey
     * @param bool   $debug
     */
    function __construct($twofaSitekey, $twofaSecretkey, $debug = false)
    {
        $this->Twofa($twofaSitekey, $twofaSecretkey, $debug);
    }
    function Twofa(string $twofaSitekey, string $twofaSecretkey, bool $debug = false)
    {
        $this->_debug = $debug;

        if ($twofaSitekey == null || $twofaSitekey == "") {
            die("You need a Twofa-Sitekey <a href='"
                . self::$_getSecretUrl . "'>" . self::$_getSecretUrl . "</a>");
        }
        $this->_twofaSitekey = $twofaSitekey;

        if ($twofaSecretkey == null || $twofaSecretkey == "") {
            die("You need a Twofa-SecretKey <a href='"
                . self::$_getSecretUrl . "'>" . self::$_getSecretUrl . "</a>");
        }
        $this->_twofaSecretkey = $twofaSecretkey;
    }

    /**
     * Encodes the given data into a query string format.
     *
     * @param array $data array of string elements to be encoded.
     *
     * @return string - encoded request.
     */
    private function _encode(array $data): string
    {
        $params = "";
        foreach ($data as $key => $value) {
            $params .= '&' . $key . '=' . urlencode(stripslashes($value));
        }

        // Cut the last '&'
        $params = substr($params, 1);
        return $params;
    }


    /**
     * Submits a Rest-Call to TwofaAuth server.
     *
     * @param string $url to TwofaAuth server.
     * @param string $method GET, PUT or POST.
     * @param array  $data array of parameters to be sent.
     *
     * @return array response (from json)
     */
    private function _doRestcall(string $url, string $method = 'GET', array $data = [])
    {
        $req = $this->_encode($data);
        $ch = curl_init($url . '?' . $req);

        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => $this->_debug,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => array('Content-type: application/json')
        ));

        $response = (string) curl_exec($ch);
        curl_close($ch);
        if (!$response) {
            return array('error'=>'empty response');
        }
        return json_decode($response, true);
    }


    /**
     * Calls Twofa Sendsms
     *
     * @param string phonenumber
     string
     * @return PostTwofaSendsmsResponse
     */
    public function postTwofaSendsms(string $phonenumber): PostTwofaSendsmsResponse
    {
        // Discard empty solution submissions
        if ($phonenumber == null || strlen($phonenumber) == 0) {
            return new PostTwofaSendsmsResponse('missing phonenumber');
        }

        $responseJson = $this->_doRestcall(
            self::$_urlTwofaApi . '/sendsms',
            'POST',
            array(
                'twofaSecretkey' => $this->_twofaSecretkey,
                'phonenumber' => $phonenumber
            )
        );

        if (isset($responseJson['error'])) {
            return new PostTwofaSendsmsResponse($responseJson['error']);
        }
        if (!isset($responseJson['challengeToken']) || strlen(trim($responseJson['challengeToken'])) <= 0) {
            return new PostTwofaSendsmsResponse('Response without challengeToken');
        }

        $postTwofaSendsmsResponse = new PostTwofaSendsmsResponse();
        $postTwofaSendsmsResponse->setChallengeToken($responseJson['challengeToken']);

        return $postTwofaSendsmsResponse;
    }


    /**
     * Calls Twofa Sendmail
     *
     * @param string mailaddress
     *
     * @return PostTwofaSendmailResponse
     */
    public function postTwofaSendmail($mailaddress): PostTwofaSendmailResponse
    {
        // Discard empty solution submissions
        if ($mailaddress == null || strlen($mailaddress) == 0) {
            return new PostTwofaSendmailResponse('missing mailaddress');
        }

        $responseJson = $this->_doRestcall(
            self::$_urlTwofaApi . '/sendmail',
            'POST',
            array(
                'twofaSecretkey' => $this->_twofaSecretkey,
                'mailaddress' => $mailaddress
            )
        );

        if (isset($responseJson['error'])) {
            return new PostTwofaSendmailResponse($responseJson['error']);
        }
        if (!isset($responseJson['challengeToken']) || strlen(trim($responseJson['challengeToken'])) <= 0) {
            return new PostTwofaSendmailResponse('Response without challengeToken');
        }

        $postTwofaSendmailResponse = new PostTwofaSendmailResponse();
        $postTwofaSendmailResponse->setChallengeToken($responseJson['challengeToken']);

        return $postTwofaSendmailResponse;
    }

    /**
     * Calls Twofa Preverifycode
     *
     * @param string challengeToken
     * @param string code
     *
     * @return PutTwofaPreverifycodeResponse
     */
    public function putTwofaPreverifycode($challengeToken, $code) :PutTwofaPreverifycodeResponse
    {
        // Discard empty solution submissions
        if ($challengeToken == null || strlen($challengeToken) == 0) {
            return new PutTwofaPreverifycodeResponse('missing challengetoken');
        }
        if ($code == null || strlen($code) == 0) {
            return new PutTwofaPreverifycodeResponse('missing code');
        }

        $responseJson = $this->_doRestcall(
            self::$_urlTwofaApi . '/preverifycode',
            'PUT',
            array(
                'twofaSitekey' => $this->_twofaSitekey,
                'challengeToken' => $challengeToken,
                'code' => $code
            )
        );

        if (!$responseJson) {
            return new PutTwofaPreverifycodeResponse('response is no json');
        }
        if (isset($responseJson['error'])) {
            return new PutTwofaPreverifycodeResponse($responseJson['error']);
        }
        if (!isset($responseJson['solved']) || trim($responseJson['solved']) != true) {
            return new PutTwofaPreverifycodeResponse('not solved yet');
        }
        if (!isset($responseJson['verifiedAddress']) || strlen(trim($responseJson['verifiedAddress'])) <= 0) {
            return new PutTwofaPreverifycodeResponse('Response without verifiedAddress');
        }

        $putTwofaPreverifycodeResponse = new PutTwofaPreverifycodeResponse();
        $putTwofaPreverifycodeResponse->setSolved(true);
        $putTwofaPreverifycodeResponse->setVerifiedAddress($responseJson['verifiedAddress']);

        return $putTwofaPreverifycodeResponse;
    }


    /**
     * Calls Twofa getChallange
     *
     * @param string challengeToken
     *
     * @return GetTwofaChallengeResponse
     */
    public function getTwofaChallenge($challengeToken): GetTwofaChallengeResponse
    {
        // Discard empty solution submissions
        if ($challengeToken == null || strlen($challengeToken) == 0) {
            return new GetTwofaChallengeResponse('missing challengetoken');
        }

        $responseJson = $this->_doRestcall(
            self::$_urlTwofaApi . '/challenge',
            'GET',
            array(
                'twofaSecretkey' => $this->_twofaSecretkey,
                'challengeToken' => $challengeToken
            )
        );

        if (isset($responseJson['error'])) {
            return new GetTwofaChallengeResponse($responseJson['error']);
        }
        if (!isset($responseJson['solved']) || trim($responseJson['solved']) != true) {
            return new GetTwofaChallengeResponse('not solved yet');
        }
        if (!isset($responseJson['verifiedAddress']) || strlen(trim($responseJson['verifiedAddress']))<=0) {
            return new GetTwofaChallengeResponse('Response without verifiedAddress');
        }

        $getTwofaChallengeResponse = new GetTwofaChallengeResponse();
        $getTwofaChallengeResponse->setSolved(true);
        $getTwofaChallengeResponse->setVerifiedAddress($responseJson['verifiedAddress']);

        return $getTwofaChallengeResponse;
    }


}