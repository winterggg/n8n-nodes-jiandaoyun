const path = require('path');
const { task, src, dest, series } = require('gulp');

task('copy:icons', copyIcons);

function copyIcons() {
	const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
	const nodeDestination = path.resolve('dist', 'nodes');

	src(nodeSource).pipe(dest(nodeDestination));

	const credSource = path.resolve('credentials', '**', '*.{png,svg}');
	const credDestination = path.resolve('dist', 'credentials');

	return src(credSource).pipe(dest(credDestination));
}

task('copy:dependencies', copyDependencies);

function copyDependencies() {
    // 列出需要复制的第三方包
    const dependencies = [
        'node_modules/lodash/**/*'
    ];

    const destination = path.resolve('dist', 'node_modules');

    return src(dependencies, { base: 'node_modules' }).pipe(dest(destination));
}

task('build', series('copy:icons', 'copy:dependencies'));
