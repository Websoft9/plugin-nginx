# Developer

## Technology Stack

**Frontend**  

- ui: [react-bootstrap](https://react-bootstrap.github.io/)
- js framework: [Create React App](https://create-react-app.dev/docs/documentation-intro)
- template: no use

**Backend API**  

- nginx proxy manager: automatic login
- cockpit: this is for running command at host machine

related classes:

- src/App.js


## Build and Test

You should install [Websoft9](https://github.com/Websoft9/websoft9) for testing, then build it:

```
git clone https://github.com/Websoft9/plugin-nginx
cd plugin-nginx

# test
yarn start
yarn test

# build
yarn build && cp -r ./build/* /usr/share/cockpit/nginx/
```