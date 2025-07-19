/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { LinkOutlined } from '@ant-design/icons';
import { notifications } from '@mantine/notifications';
import type { Monaco } from '@monaco-editor/react';
import MonacoEditor from '@monaco-editor/react';
import { Button, Drawer, Select, Space } from 'antd';
import type { languages } from 'monaco-editor';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { json2yaml, yaml2json } from '@/utils/yaml-helpers';

type Props = {
  visible: boolean;
  readonly: boolean;
  type: 'route' | 'service' | 'consumer' | 'upstream';
  data: Record<string, unknown>;
  onClose?: () => void;
  onSubmit?: (data: Record<string, unknown>) => void;
};

enum MonacoLanguageList {
  JSON = 'JSON',
  YAML = 'YAML',
}

type MonacoLanguage = MonacoLanguageList.JSON | MonacoLanguageList.YAML;

const RawDataEditor: React.FC<Props> = ({
  visible,
  readonly = true,
  type,
  data = {},
  onClose = () => {},
  onSubmit = () => {},
}) => {
  const { t } = useTranslation();
  const [monacoLanguage, setMonacoLanguage] = useState<MonacoLanguage>(
    MonacoLanguageList.JSON,
  );
  const [content, setContent] = useState('');

  useEffect(() => {
    switch (monacoLanguage) {
      case MonacoLanguageList.JSON:
        setContent(JSON.stringify(data, null, 2));
        break;
      case MonacoLanguageList.YAML: {
        const { data: yamlData } = json2yaml(JSON.stringify(data, null, 2));
        setContent(yamlData);
        break;
      }
      default:
    }
  }, [data, monacoLanguage]);

  useEffect(() => {
    setMonacoLanguage(MonacoLanguageList.JSON);
  }, [visible]);

  const modeOptions = [
    { label: MonacoLanguageList.JSON, value: MonacoLanguageList.JSON },
    { label: MonacoLanguageList.YAML, value: MonacoLanguageList.YAML },
  ];

  const handleModeChange = (value: MonacoLanguage) => {
    switch (value) {
      case MonacoLanguageList.JSON:
        setContent((c) => {
          const { data: jsonData, error } = yaml2json(c, true);
          if (error) {
            notifications.show({ 
              message: t('form.btn.cancel', 'Invalid YAML'),
              color: 'red'
            });
            return c;
          }
          return JSON.stringify(JSON.parse(jsonData), null, 2);
        });
        break;
      case MonacoLanguageList.YAML:
        setContent((c) => {
          const { data: yamlData, error } = json2yaml(c);
          if (error) {
            notifications.show({ 
              message: t('form.btn.cancel', 'Invalid JSON'),
              color: 'red'
            });
            return c;
          }
          return yamlData;
        });
        break;
      default:
        break;
    }
    setMonacoLanguage(value);
  };

  const formatYaml = (yaml: string): string => {
    const json = yaml2json(yaml, true);
    if (json.error) {
      return yaml;
    }
    return json2yaml(json.data).data;
  };

  const editorWillMount = (monaco: Monaco) => {
    const yamlFormatProvider: languages.DocumentFormattingEditProvider = {
      provideDocumentFormattingEdits(model) {
        return [
          {
            text: formatYaml(model.getValue()),
            range: model.getFullModelRange(),
          },
        ];
      },
    };
    monaco.languages.registerDocumentFormattingEditProvider('yaml', yamlFormatProvider);
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      trailingCommas: 'error',
    });
  };

  return (
    <>
      <Drawer
        title={t('component.global.data.editor', 'Data Editor')}
        placement="right"
        width={700}
        open={visible}
        onClose={onClose}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={onClose} key={1}>
              {t('component.global.cancel', 'Cancel')}
            </Button>
            <Space>
              <Button
                key={2}
                type="primary"
                onClick={() => {
                  try {
                    const editorData =
                      monacoLanguage === MonacoLanguageList.JSON
                        ? JSON.parse(content)
                        : yaml2json(content, false).data;
                    onSubmit(editorData);
                  } catch {
                    notifications.show({
                      message: t('component.global.invalidJson', 'Invalid JSON'),
                      color: 'red',
                    });
                  }
                }}
              >
                {t('component.global.submit', 'Submit')}
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              key="monaco-language"
              defaultValue={MonacoLanguageList.JSON}
              value={monacoLanguage}
              options={modeOptions}
              onChange={(value: MonacoLanguage) => {
                handleModeChange(value);
              }}
              data-cy="monaco-language"
            />
            <Button
              type="primary"
              key="copy"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(content);
                  notifications.show({
                    message: t('component.global.copySuccess', 'Copy successful'),
                    color: 'green',
                  });
                } catch {
                  notifications.show({
                    message: t('component.global.copyFail', 'Copy failed'),
                    color: 'red',
                  });
                }
              }}
            >
              {t('component.global.copy', 'Copy')}
            </Button>
            <Button
              type="default"
              icon={<LinkOutlined />}
              onClick={() => {
                window.open(`https://apisix.apache.org/docs/apisix/admin-api#${type}`);
              }}
              key="document"
            >
              {t('component.global.document', 'Document')}
            </Button>
          </div>
        </div>
        <MonacoEditor
          value={content}
          onChange={(text) => {
            if (text) {
              setContent(text);
            } else {
              setContent('');
            }
          }}
          onMount={(editor) => {
            // NOTE: for debug & test
            // @ts-expect-error Global assignment for debugging
            window.monacoEditor = editor;
          }}
          beforeMount={editorWillMount}
          language={monacoLanguage.toLowerCase()}
          options={{
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden',
            },
            wordWrap: 'on',
            minimap: { enabled: false },
            readOnly: readonly,
          }}
        />
      </Drawer>
    </>
  );
};

export default RawDataEditor;
