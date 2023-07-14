import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import cockpit from 'cockpit';
import { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import './App.css';

function App() {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [iframeKey, setIframeKey] = useState(Math.random());
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  var baseURL;

  const getData = async () => {
    let protocol = window.location.protocol;
    let host = window.location.host;
    let tokens = localStorage.getItem("nginx_tokens");
    let nikeName = localStorage.getItem("nginx_nikeName");
    baseURL = protocol + "//" + (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(host) ? host.split(":")[0] : host);

    try {
      if (!tokens || !nikeName) {
        let data = await cockpit.spawn(["docker", "inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "websoft9-appmanage"]);
        let IP = data.trim();
        if (IP) {
          let response = await cockpit.http({ "address": IP, "port": 5000 }).get("/AppSearchUsers", { "plugin_name": "nginx" });
          response = JSON.parse(response);
          if (response.ResponseData) {
            var userName = response.ResponseData.user?.user_name;
            var userPwd = response.ResponseData.user?.password;
            nikeName = response.ResponseData.user?.nick_name;

            const authResponse = await axios.post(baseURL + "/nginxproxymanager/api/tokens", {
              identity: userName,
              secret: userPwd
            });
            if (authResponse.status === 200) {
              tokens = authResponse.data.token;
              window.localStorage.setItem("nginx_tokens", tokens);
              window.localStorage.setItem("nginx_nikeName", nikeName);
            } else {
              setShowAlert(true);
              setAlertMessage("Auth Nginxproxymanager Error.")
            }
          }
        }
      }
    }
    catch (error) {
      setShowAlert(true);
      setAlertMessage("Call Nginxproxymanager Page Error.")
    }


    setIframeKey(Math.random());
    var newHash = window.location.hash;
    if (newHash.includes("/nginxproxymanager")) {
      var index = newHash.indexOf("#");
      if (index > -1) {
        var content = newHash.slice(index + 1);
        setIframeKey(Math.random());
        setIframeSrc(baseURL + content + "?Token=" + tokens + "&Name=" + nikeName);
      }
    }
    else {
      setIframeSrc(baseURL + "/nginxproxymanager/?Token=" + tokens + "&Name=" + nikeName);
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