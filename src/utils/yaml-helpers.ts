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
import { parse, stringify } from 'yaml';

export const json2yaml = (jsonString: string) => {
  try {
    const obj = JSON.parse(jsonString);
    const yamlString = stringify(obj, null, { indent: 2 });
    return { data: yamlString, error: null };
  } catch (error) {
    return { data: '', error: error instanceof Error ? error.message : 'Invalid JSON' };
  }
};

export const yaml2json = (yamlString: string, formatted = false) => {
  try {
    const obj = parse(yamlString);
    const jsonString = formatted ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    return { data: jsonString, error: null };
  } catch (error) {
    return { data: '', error: error instanceof Error ? error.message : 'Invalid YAML' };
  }
};
