import { config, material, project } from '@alilc/lowcode-engine';
import { filterPackages } from '@alilc/lowcode-plugin-inject'
import { Message, Dialog } from '@alifd/next';
import { IPublicTypeProjectSchema, IPublicEnumTransformStage } from '@alilc/lowcode-types';
import DefaultPageSchema from './defaultPageSchema.json';
import DefaultI18nSchema from './defaultI18nSchema.json';
import { request, save } from '../api/schema';

const generateProjectSchema = (pageSchema: any, i18nSchema: any): IPublicTypeProjectSchema => {
  return {
    componentsTree: [pageSchema],
    componentsMap: material.componentsMap as any,
    version: '1.0.0',
    i18n: i18nSchema,
  };
}

const setProjectSchemaToLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  let key = getLSName(scenarioName);
  let value = JSON.stringify(project.exportSchema(IPublicEnumTransformStage.Save));
  console.log('setProjectSchemaToLocalStorage', key, value);
  window.localStorage.setItem(key, value);
}

const setProjectSchemaToServer = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  let key = getLSName(scenarioName);
  let value = project.exportSchema(IPublicEnumTransformStage.Save);
  await save({
    page: key,
    schema: value 
  })
}

const setPackagesToLocalStorage = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const packages = await filterPackages(material.getAssets().packages);
  let key = getLSName(scenarioName, 'packages');
  let value = JSON.stringify(packages);
  console.log('setPackagesToLocalStorage', key, value);
  window.localStorage.setItem(key, value);
}

const setPackagesToServer = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const packages = await filterPackages(material.getAssets().packages);
  let key = getLSName(scenarioName, 'packages');
  let value = packages;
  await save({
    page: key,
    schema: value 
  })
}

export const saveSchema = async (scenarioName: string = 'unknown', type: string = 'server') => {
  if(type === 'server') {
    await setProjectSchemaToServer(scenarioName);
    await setPackagesToServer(scenarioName);
    Message.success('成功保存到服务器');
  }else if(type === 'local'){
    setProjectSchemaToLocalStorage(scenarioName);
    await setPackagesToLocalStorage(scenarioName);
    Message.success('成功保存到本地');
  }
}

export const resetSchema = async (scenarioName: string = 'unknown') => {
  try {
    await new Promise<void>((resolve, reject) => {
      Dialog.confirm({
        content: '确定要重置吗？您所有的修改都将消失！',
        onOk: () => {
          resolve();
        },
        onCancel: () => {
          reject()
        },
      })
    })
  } catch(err) {
    return;
  }
  const defaultSchema = generateProjectSchema(DefaultPageSchema, DefaultI18nSchema);

  project.importSchema(defaultSchema as any);
  project.simulatorHost?.rerender();

  setProjectSchemaToLocalStorage(scenarioName);
  await setPackagesToLocalStorage(scenarioName);
  Message.success('成功重置页面');
}

// 之前的代码
// const getLSName = (scenarioName: string, ns: string = 'projectSchema') => `${scenarioName}:${ns}`;
const getLSName = (scenarioName: string, ns: string = 'projectSchema') => `${scenarioName}-${ns}`;

export const getProjectSchemaFromLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const localValue = window.localStorage.getItem(getLSName(scenarioName));
  if (localValue) {
    return JSON.parse(localValue);
  }
  return undefined;
}

export const getProjectSchemaFromServer = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  try {
    let value = await request(`https://huangzimo.oss-cn-chengdu.aliyuncs.com/portal/${getLSName(scenarioName)}.json`)
    return value 
  } catch (error) {
    return undefined
  }
}

export const getProjectSchema = async (scenarioName: string = 'unknown', type: string = 'server') : Promise<IPublicTypeProjectSchema> => {
  const pageSchema = await getPageSchema(scenarioName, type);
  return generateProjectSchema(pageSchema, DefaultI18nSchema);
};

export const getPageSchema = async (scenarioName: string = 'unknown', type: string = 'server') => {
  let pageSchema 
  try {
    if(type === 'server') {
      pageSchema = await getProjectSchemaFromServer(scenarioName)?.componentsTree?.[0];
    }else{
      pageSchema = getProjectSchemaFromLocalStorage(scenarioName)?.componentsTree?.[0];
    }
    if (pageSchema) {
      return pageSchema;
    }
  } catch (error) {
    console.error(error)
  }
  return DefaultPageSchema;
}



export const getPackagesFromLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  return JSON.parse(window.localStorage.getItem(getLSName(scenarioName, 'packages')) || '{}');
}

export const getPackagesFromServer = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  try {
    let value = await request(`https://huangzimo.oss-cn-chengdu.aliyuncs.com/portal/${getLSName(scenarioName, 'packages')}.json`)
    return value 
  } catch (error) {
    return undefined
  }
}

export const getPackages = async (scenarioName: string, type: stirng = 'server') => {
  if(type === 'server') {
    return await getPackagesFromServer(scenarioName);
  }else{
    return getPackagesFromLocalStorage(scenarioName);
  }
}

export const getPageSchemaFromLocalStorage = async (scenarioName: string = 'unknown') => {
  const pageSchema = getProjectSchemaFromLocalStorage(scenarioName)?.componentsTree?.[0];
  if (pageSchema) {
    return pageSchema;
  }
  return DefaultPageSchema;
};

export const getPageSchemaFromServer = async (scenarioName: string = 'unknown') => {
  const pageSchema = await getProjectSchemaFromServer(scenarioName)?.componentsTree?.[0];
  if (pageSchema) {
    return pageSchema;
  }
  return DefaultPageSchema;
};

export const getPreviewLocale = (scenarioName: string) => {
  const key = getLSName(scenarioName, 'previewLocale');
  return window.localStorage.getItem(key) || 'zh-CN';
}

export const setPreviewLocale = (scenarioName: string, locale: string) => {
  const key = getLSName(scenarioName, 'previewLocale');
  window.localStorage.setItem(key, locale || 'zh-CN');
  window.location.reload();
}

