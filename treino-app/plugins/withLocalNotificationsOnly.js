// Config plugin com dois ajustes necessários pra buildar com Apple ID grátis:
//
// 1. Remove o entitlement `aps-environment` (Push Notifications) que o
//    expo-notifications adiciona por padrão. Usamos APENAS notificações locais
//    (rest timer), e contas grátis (Personal Team) não suportam Push — o que
//    impede a geração do provisioning profile.
//
// 2. Desliga `ENABLE_USER_SCRIPT_SANDBOXING`. O script do React Native escreve
//    arquivos (ip.txt etc.) no bundle durante o build; com o sandbox de scripts
//    ligado (default), a escrita é negada e o build falha.
const { withEntitlementsPlist, withXcodeProject } = require('expo/config-plugins');

function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    if (cfg.modResults && 'aps-environment' in cfg.modResults) {
      delete cfg.modResults['aps-environment'];
    }
    return cfg;
  });
}

function withoutScriptSandbox(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings) {
        buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      }
    }
    return cfg;
  });
}

module.exports = function withLocalNotificationsOnly(config) {
  return withoutScriptSandbox(withoutPushEntitlement(config));
};
