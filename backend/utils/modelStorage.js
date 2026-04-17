import * as tf from '@tensorflow/tfjs';
import fs from 'fs/promises';
import path from 'path';

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const serializeWeightData = (weightData) => {
  if (weightData instanceof ArrayBuffer) {
    return Buffer.from(weightData);
  }

  if (ArrayBuffer.isView(weightData)) {
    return Buffer.from(
      weightData.buffer,
      weightData.byteOffset,
      weightData.byteLength
    );
  }

  return Buffer.from(weightData);
};

const bufferToArrayBuffer = (buffer) =>
  buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );

export const saveModelToPath = async (model, targetDir) => {
  const saveHandler = tf.io.withSaveHandler(async (artifacts) => {
    await ensureDir(targetDir);

    const manifest = [
      {
        paths: ['weights.bin'],
        weights: artifacts.weightSpecs,
      },
    ];

    const serialized = {
      modelTopology: artifacts.modelTopology,
      format: artifacts.format,
      generatedBy: artifacts.generatedBy,
      convertedBy: artifacts.convertedBy,
      trainingConfig: artifacts.trainingConfig ?? null,
      weightsManifest: manifest,
    };

    await fs.writeFile(
      path.join(targetDir, 'model.json'),
      JSON.stringify(serialized, null, 2),
      'utf-8'
    );

    const weightBuffer = serializeWeightData(artifacts.weightData);
    await fs.writeFile(path.join(targetDir, 'weights.bin'), weightBuffer);

    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
        weightDataBytes: weightBuffer.byteLength,
      },
    };
  });

  await model.save(saveHandler);
};

export const loadModelFromPath = async (targetDir) => {
  const modelPath = path.join(targetDir, 'model.json');
  const weightsPath = path.join(targetDir, 'weights.bin');

  const loadHandler = {
    load: async () => {
    const [modelJSONRaw, weightBuffer] = await Promise.all([
      fs.readFile(modelPath, 'utf-8'),
      fs.readFile(weightsPath),
    ]);

    const modelJSON = JSON.parse(modelJSONRaw);

    return {
      modelTopology: modelJSON.modelTopology,
      format: modelJSON.format,
      generatedBy: modelJSON.generatedBy,
      convertedBy: modelJSON.convertedBy,
      trainingConfig: modelJSON.trainingConfig,
      weightSpecs: modelJSON.weightsManifest?.[0]?.weights ?? [],
      weightData: bufferToArrayBuffer(weightBuffer),
    };
    },
  };

  return tf.loadLayersModel(loadHandler);
};

