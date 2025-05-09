dependencies {
    implementation(project(":model"))
    implementation(project(":dialogProvider"))
    implementation(project(":analysers:AnalyserInterface"))

    implementation(libs.boon)
    implementation(libs.slf4j.simple)
    implementation(libs.picocli)
    implementation(libs.univocity.parsers)
    implementation(libs.kotter)
    implementation(libs.kotter.test)
}

tasks.test {
    useJUnitPlatform()
}
