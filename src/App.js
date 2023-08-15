import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import cockpit from 'cockpit';
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
  function isTokenExpired(token) {
    const decodedToken = jwt_decode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  }

  const getToken = async () => {
    let response = await cockpit.http({ "address": "websoft9-appmanage", "port": 5000 }).get("/AppSearchUsers", { "plugin_name": "nginx" });
    response = JSON.parse(response);
    if (response.ResponseData) {
      var userName = response.ResponseData.user?.user_name;
      var userPwd = response.ResponseData.user?.password;
      var nikeName = response.ResponseData.user?.nick_name;

      const authResponse = await axios.post(baseURL + "/nginxproxymanager/api/tokens", {
        identity: userName,
        secret: userPwd
      });
      if (authResponse.status === 200) {
        var tokens = authResponse.data.token;
        document.cookie = "nginx_tokens=" + tokens + "; path=/";
        document.cookie = "nginx_nikeName=" + nikeName + "; path=/";
      } else {
        setShowAlert(true);
        setAlertMessage("Auth Nginxproxymanager Error.")
      }
    }
  }

  const getData = async () => {
    const tokens = getCookieValue("nginx_tokens");
    const nikeName = getCookieValue("nginx_nikeName");

    try {
      if (!tokens || !nikeName) {
        await getToken();
      }
      else {
        const isExpired = isTokenExpired(tokens);
        if (isExpired) { //如果已经过期，重新生成Tokens
          await getToken();
        }
      }

      setIframeKey(Math.random());
      var newHash = window.location.hash;
      if (newHash.includes("/nginxproxymanager")) {
        var index = newHash.indexOf("#");
        if (index > -1) {
          var content = newHash.slice(index + 1);
          setIframeKey(Math.random());
          setIframeSrc(baseURL + content);
        }
      }
      else {
        setIframeSrc(baseURL + "/nginxproxymanager/");
      }
    }
    catch (error) {
      setShowAlert(true);
      setAlertMessage("Call Nginxproxymanager Page Error.")
    }
  }

  const handleHashChange = () => {
    var newHash = window.location.hash;
    if (newHash.includes("/nginxproxymanager")) {
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
        (iframeKey && iframeSrc) ? (
          <div className='myNginx' key='container'>
            <iframe key={iframeKey} title='nginxproxymanager' src={iframeSrc} />
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-center m-5">
            <Spinner animation="border" variant="secondary" />
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