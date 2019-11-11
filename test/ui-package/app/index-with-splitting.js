const appModule = () => {
  import("./lazyfile").then((lazyModule) => {
    console.log(lazyModule);
  });
};

export default appModule;
