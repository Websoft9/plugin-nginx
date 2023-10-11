import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import cockpit from 'cockpit';
import ini from 'ini';
import jwt_decode from 'jwt-decode';
import { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import './App.css';

function App() {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [iframeKey, setIframeKey] = useState(Math.random());
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [tokenLoaded, setTokenLoaded] = useState(false);

  let protocol = window.location.protocol;
  let host = window.location.host;
  const baseURL = protocol + "//" + (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(host) ? host.split(":")[0] : host);

  //获取cookie
  function getCookieValue(cookieName) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null; // 如果没有找到该 Cookie 返回 null
  }

  //验证token是否过期
  async function isTokenExpired(token) {
    const decodedToken = jwt_decode(token);
    const currentTime = await cockpit.spawn(["date", "+%s"]);
    //const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  }

  const getToken = async () => {
    var userName;
    var userPwd;
    var nikeName;
    cockpit.file('/data/websoft9/appmanage_new/src/config/config.ini').read().then(async (content) => {
      const config = ini.parse(content);
      userName = config.nginx_proxy_manager.user_name
      userPwd = config.nginx_proxy_manager.user_pwd
      nikeName = config.nginx_proxy_manager.nike_name

      if (!userName || !userPwd || !nikeName) {
        setShowAlert(true);
        setAlertMessage("Nginx Username or Password is empty.");
        return;
      }

      const authResponse = await axios.post(baseURL + "/w9proxy/api/tokens", {
        identity: userName,
        secret: userPwd
      });
      if (authResponse.status === 200) {
        var tokens = authResponse.data.token;
        document.cookie = "nginx_tokens=" + tokens + "; path=/";
        document.cookie = "nginx_nikeName=" + nikeName + "; path=/";
        setTokenLoaded(true);
      } else {
        setShowAlert(true);
        setAlertMessage("Auth Nginxproxymanager Error.")
      }
    }).catch(error => {
      setShowAlert(true);
      setAlertMessage("Get Nginx Login Info Error.");
    })
  }

  const getData = async () => {
    const tokens = getCookieValue("nginx_tokens");
    const nikeName = getCookieValue("nginx_nikeName");

    try {
      if (!tokens || !nikeName) {
        await getToken();
      }
      else {
        const isExpired = await isTokenExpired(tokens);
        if (isExpired) { //如果已经过期，重新生成Tokens
          await getToken();
        }
      }

      setIframeKey(Math.random());
      var newHash = window.location.hash;
      if (newHash.includes("/w9proxy")) {
        var index = newHash.indexOf("#");
        if (index > -1) {
          var content = newHash.slice(index + 1);
          setIframeKey(Math.random());
          setIframeSrc(baseURL + content);
        }
      }
      else {
        setIframeSrc(baseURL + "/w9proxy/");
      }
    }
    catch (error) {
      setShowAlert(true);
      setAlertMessage("Call Nginxproxymanager Page Error." + error)
    }
  }

  const handleHashChange = () => {
    var newHash = window.location.hash;
    if (newHash.includes("/w9proxy")) {
      var index = newHash.indexOf("#");
      if (index > -1) {
        var content = newHash.slice(index + 1);
        setIframeKey(Math.random());
        setIframeSrc(baseURL + content);
      }
    }
  }

  useEffect(async () => {
    await getData();

    window.addEventListener("hashchange", handleHashChange, true);
    return () => {
      window.removeEventListener("hashchange", handleHashChange, true);
    };
  }, []);

  return (
    <>
      {
        (iframeKey && iframeSrc && tokenLoaded) ? (
          <div className='myNginx' key='container'>
            <iframe key={iframeKey} title='nginxproxymanager' src={iframeSrc} />
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-center m-5" style={{ flexDirection: "column" }}>
            <Spinner animation="border" variant="secondary" className='mb-5' />
            {showAlert && <Alert variant="danger" className="my-2">
              {alertMessage}
            </Alert>}
          </div>
        )
      }
    </>
  );
}

export default App;