# CodeCharta analysis

[![Quality Gate Status For Analysis](https://sonarcloud.io/api/project_badges/measure?project=maibornwolff-gmbh_codecharta_analysis&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=maibornwolff-gmbh_codecharta_analysis)

> CodeCharta by [MaibornWolff](https://www.maibornwolff.de)

## CodeCharta analysis tools

CodeCharta analysis tools generally follow the pipes and filters architecture principle.

### Parser

Components that generate metrics from a given source, e.g. source code or log files.

| Source             | Project                                               |
| ------------------ | ----------------------------------------------------- |
| Git log            | [GitLogParser](import/GitLogParser/README.md)         |
| Source Code / Text | [RawTextParser](parser/RawTextParser/README.md)       |
| Source Code (Java) | [SourceCodeParser](import/SourceCodeParser/README.md) |
| SVN log            | [SVNLogParser](import/SVNLogParser/README.md)         |

### Importer

Components that import data from an external source, e.g. SonarQube, and generate visualisation data.

| Source            | Project                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| CodeMaat CSV      | [CodeMaatImporter](import/CodeMaatImporter/README.md)                            |
| Test Coverage Reports | [CoverageImporter](import/CoverageImporter/README.md)                            |
| generic CSV       | [CSVImporter](import/CSVImporter/README.md)                                      |
| SonarQube         | [SonarImporter](import/SonarImporter/README.md)                                  |
| SourceMonitor CSV | [SourceMonitorImporter](import/CSVImporter/README.md)                            |
| Tokei             | [TokeiImporter](import/TokeiImporter/README.md)                                  |

### Filter

Components that take visualisation data and modifies them.

| Name                                                    | Description                                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [EdgeFilter](filter/EdgeFilter/README.md)               | aggregates edge-attributes of each appropriate node and inserts them into the nodes attribute-list |
| [MergeFilter](filter/MergeFilter/README.md)             | merges multiple json files                                                                         |
| [StructureModifier](filter/StructureModifier/README.md) | modifies the structure of .cc.json files                                                           |

### Exporter

Components that export data from visualisation data to other formats.

| Target             | Project                                     |
| ------------------ | ------------------------------------------- |
| CSV (experimental) | [CSVExporter](export/CSVExporter/README.md) |

### Additional Tools

| Name                                             | Description                               |
| ------------------------------------------------ |-------------------------------------------|
| [ValidationTool](tools/ValidationTool/README.md) | validates a given json file               |
| [InspectionTool](tools/InspectionTool/README.md)   | shows information about a given json file |

## Requirements

- Bash or similar
- Java >= 11, <= 21

# JSON structure

The files generated by the analysis tools (except exporters) are `cc.json` files. This special structure ensures that the files can be imported in the visualisation and be displayed correctly.

For an example of how a `cc.json` file might look , check out the [Example Data](/visualization/app/codeCharta/assets/sample1.cc.json).

If you want to learn more about the used schema, check out the [JSON Schema](/visualization/app/codeCharta/util/generatedSchema.json).

# Installation methods

You can start with **Codecharta Analysis** on multiple ways:

- [Installation](#installation-via-npm) as a [npm package](#installation-via-npm) (Recommended for users)
- Use our [Docker Image](#installation-via-docker) to run the analysis in a container
- Use [docker-compose](https://maibornwolff.github.io/codecharta/docs/docker-containers/) to run the analysis in a
  complete environment with other needed tools like Sonar and a running CodeCharta Visualization instance to view your
  city map.
- Download the SourceCode from the asset section of a release and [extract it](#extract-tar-or-zip-archive)
- Clone the repository and [build it yourself](#build-it-yourself) (Development)

## Installation via npm

This installs all binaries to run the analysis. Java 11 is recommended, while Java 8 might work.

`npm install -g codecharta-analysis`

To run it you can call `ccsh`

## Installation via Docker

You can use Codecharta analysis in multiple ways. This section will deal with how to use the analysis as a standalone
container. For information on how to use with docker compose, please check out
our [docker compose documentation](https://maibornwolff.github.io/codecharta/docs/docker-containers/).
We assume that you already installed docker, if not, you have to do that before!

To containerize the analysis, please follow the below listed steps.

- Navigate into the directory you want to analyse with CodeCharta. There are multiple ways to use the docker image:
  1. Start the docker container and a bash shell in it
     with `docker run --name codecharta-analysis -it -v $(pwd):$(pwd) -w $(pwd) codecharta/codecharta-analysis bash`.
     This runs the image, names the container `codecharta-analysis`, mounts the current directory and sets it as the
     working directory of your container. You can now use the codecharta shell or any other of the tools installed in
     the container via the command line.
  2. Start the docker container and directly use some command (like the
     ccsh): `docker run --name codecharta-analysis -it -v $(pwd):$(pwd) -w $(pwd) codecharta/codecharta-analysis ccsh`.
     This starts the Ccsh without any commands, which will open an interactive codecharta shell that will guide you
     through the parsing/analyzing process. The working directory of your Terminal will be used as the working
     directory of the container.
  3. Start the docker container and directly use a specific
     parser: `docker run --name codecharta-analysis -it -v $(pwd):$(pwd) -w $(pwd) codecharta/codecharta-analysis ccsh rawtextparser .`.
     This starts the RawTextParser in the current working directory in a container.
- After executing the run command once, you can repeat the same docker configuration
  with `docker start codecharta-analysis` or you have to change the name or delete the old container if you want
  to `docker run` a different configuration.
- After analysing, you can copy any results
  with `docker cp codecharta-analysis:/your/path/fileName.cc.json fileName.cc.json` to your current working directory (
  replace `/your/path/` with correct path in container). If this does not work, make sure you assigned the
  name `codecharta-analysis` to your container, if not use the correct name or container id.

## Extract tar or zip archive

- Download / build package
- Unzip / untar package in desired destination folder (named CC_INSTALL_DIR)
- In bash:
  > ./bin/ccsh -h
- Activate Bash (TAB) Autocompletion for ccsh command:
  > source <(./bin/ccsh generate-completion)
  - Enter `ccsh` and press `TAB` to see available commands
  - Enter `ccsh <ANY-COMMAND> -` and press `TAB` to see available parameters

# Build it yourself

There are some additional requirements if you want to build it yourself:

- NodeJS

## Build

Via gradle:

> ./gradlew distTar

## Test

- Unit tests:

> ./gradlew test

- Integration tests:

> ./gradlew integrationTest

## Code Style

Please check out the [DEV_START_GUIDE](../DEV_START_GUIDE.md).

## License

Some parts of CodeCharta's SourceCodeParser use the [SonarJava library](https://github.com/SonarSource/sonar-java/), which is licensed
under the GNU Lesser General Public Library, version 3.
