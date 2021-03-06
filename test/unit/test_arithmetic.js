'use strict';

describe('arithmetic', () => {
    let globalDeletionQueue;

    let colour;
    let mono;
    let all_images;

    before(function () {
        const im = vips.Image.maskIdeal(100, 100, 0.5, {
            reject: true,
            optical: true
        });
        colour = im.multiply([1, 2, 3]).add([2, 3, 4]);
        mono = colour.extractBand(1);
        all_images = [mono, colour];

        globalDeletionQueue = vips.deletionQueue.splice(0);
    });

    after(function () {
        while (globalDeletionQueue.length) {
            const obj = globalDeletionQueue.pop();
            obj.$$.deleteScheduled = false;
            obj.delete();
        }
    });

    afterEach(function () {
        cleanup();
    });

    function run_arith(fn, fmt = Helpers.all_formats) {
        all_images.forEach(x => fmt.forEach(y => fmt.forEach(z =>
            Helpers.run_image2(
                `${fn.name} image ${Helpers.image_to_string(x)} ${y} ${z}`,
                x.cast(y), x.cast(z), fn)
        )));
    }

    function run_arith_const(fn, fmt = Helpers.all_formats) {
        all_images.forEach(x => fmt.forEach(y =>
            Helpers.run_const(
                `${fn.name} scalar ${Helpers.image_to_string(x)} ${y}`,
                fn, x.cast(y), 2)
        ));
        fmt.forEach(y =>
            Helpers.run_const(
                `${fn.name} vector ${Helpers.image_to_string(colour)} ${y}`,
                fn, colour.cast(y), [1, 2, 3])
        );
    }

    // run a function on an image,
    // 50,50 and 10,10 should have different values on the test image
    function run_imageunary(message, im, fn) {
        Helpers.run_cmp(message, im, 50, 50, (x) => Helpers.run_fn(fn, x));
        Helpers.run_cmp(message, im, 10, 10, (x) => Helpers.run_fn(fn, x));
    }

    function run_unary(images, fn, fmt = Helpers.all_formats) {
        images.forEach(x => fmt.forEach(y => run_imageunary(`${fn.name} image`, x.cast(y), fn)));
    }

    // test all operator overloads we define

    it('add', function () {
        const add = (x, y) => {
            if (x instanceof vips.Image) {
                return x.add(y);
            }
            if (y instanceof vips.Image) {
                return y.add(x);
            }

            return x + y;
        };

        run_arith_const(add);
        run_arith(add);
    });

    it('sub', function () {
        const sub = (x, y) => {
            if (x instanceof vips.Image) {
                return x.subtract(y);
            }
            if (y instanceof vips.Image) {
                return y.linear(-1, x);
            }

            return x - y;
        };

        run_arith_const(sub);
        run_arith(sub);
    });

    it('mul', function () {
        const mul = (x, y) => {
            if (x instanceof vips.Image) {
                return x.multiply(y);
            }
            if (y instanceof vips.Image) {
                return y.multiply(x);
            }

            return x * y;
        };

        run_arith_const(mul);
        run_arith(mul);
    });

    it('div', function () {
        const div = (x, y) => {
            if (x instanceof vips.Image) {
                return x.divide(y);
            }
            if (y instanceof vips.Image) {
                return y.pow(-1).multiply(x);
            }

            return x / y;
        };

        // (const / image) needs (image ** -1), which won't work for complex
        run_arith_const(div, Helpers.noncomplex_formats);
        run_arith(div);
    });

    it('floordiv', function () {
        const floordiv = (x, y) => {
            if (x instanceof vips.Image) {
                return x.divide(y).floor();
            }
            if (y instanceof vips.Image) {
                return y.pow(-1).multiply(x).floor();
            }

            return Math.floor(x / y);
        };

        // (const / image) needs (image ** -1), which won't work for complex
        run_arith_const(floordiv, Helpers.noncomplex_formats);
        run_arith(floordiv);
    });

    it('pow', function () {
        const pow = (x, y) => {
            if (x instanceof vips.Image) {
                return x.pow(y);
            }
            if (y instanceof vips.Image) {
                return y.wop(x);
            }

            return x ** y;
        };

        // (image ** x) won't work for complex images ... just test non-complex
        run_arith_const(pow, Helpers.noncomplex_formats);
        run_arith(pow, Helpers.noncomplex_formats);
    });

    it('and', function () {
        const and = (x, y) => {
            if (x instanceof vips.Image) {
                return x.and(y);
            }
            if (y instanceof vips.Image) {
                return y.and(x);
            }

            return x & y;
        };

        run_arith_const(and, Helpers.noncomplex_formats);
        run_arith(and, Helpers.noncomplex_formats);
    });

    it('or', function () {
        const or = (x, y) => {
            if (x instanceof vips.Image) {
                return x.or(y);
            }
            if (y instanceof vips.Image) {
                return y.or(x);
            }

            return x | y;
        };

        run_arith_const(or, Helpers.noncomplex_formats);
        run_arith(or, Helpers.noncomplex_formats);
    });

    it('xor', function () {
        const xor = (x, y) => {
            if (x instanceof vips.Image) {
                return x.eor(y);
            }
            if (y instanceof vips.Image) {
                return y.eor(x);
            }

            return x ^ y;
        };

        run_arith_const(xor, Helpers.noncomplex_formats);
        run_arith(xor, Helpers.noncomplex_formats);
    });

    it('more', function () {
        const more = (x, y) => {
            if (x instanceof vips.Image) {
                return x.more(y);
            }
            if (y instanceof vips.Image) {
                return y.less(x);
            }

            return x > y ? 255 : 0;
        };

        run_arith_const(more);
        run_arith(more);
    });

    it('moreEq', function () {
        const moreEq = (x, y) => {
            if (x instanceof vips.Image) {
                return x.moreEq(y);
            }
            if (y instanceof vips.Image) {
                return y.lessEq(x);
            }

            return x >= y ? 255 : 0;
        };

        run_arith_const(moreEq);
        run_arith(moreEq);
    });

    it('less', function () {
        const less = (x, y) => {
            if (x instanceof vips.Image) {
                return x.less(y);
            }
            if (y instanceof vips.Image) {
                return y.more(x);
            }

            return x < y ? 255 : 0;
        };

        run_arith_const(less);
        run_arith(less);
    });

    it('lessEq', function () {
        const lessEq = (x, y) => {
            if (x instanceof vips.Image) {
                return x.lessEq(y);
            }
            if (y instanceof vips.Image) {
                return y.moreEq(x);
            }

            return x <= y ? 255 : 0;
        };

        run_arith_const(lessEq);
        run_arith(lessEq);
    });

    it('equal', function () {
        const equal = (x, y) => {
            if (x instanceof vips.Image) {
                return x.equal(y);
            }
            if (y instanceof vips.Image) {
                return y.equal(x);
            }

            return x === y ? 255 : 0;
        };

        run_arith_const(equal);
        run_arith(equal);
    });

    it('notEq', function () {
        const notEq = (x, y) => {
            if (x instanceof vips.Image) {
                return x.notEq(y);
            }
            if (y instanceof vips.Image) {
                return y.notEq(x);
            }

            return x !== y ? 255 : 0;
        };

        run_arith_const(notEq);
        run_arith(notEq);

        // comparisons against out of range values should always fail, and
        // comparisons to fractional values should always fail
        const x = vips.Image.grey(256, 256, {
            uchar: true
        });
        expect(x.equal(1000).max()).to.equal(0);
        expect(x.equal(12).max()).to.equal(255);
        expect(x.equal(12.5).max()).to.equal(0);
    });

    it('abs', function () {
        const abs = (x) => x instanceof vips.Image ? x.abs() : Math.abs(x);

        const im = colour.multiply(-1);
        run_unary([im], abs);
    });

    it('lshift', function () {
        const lshift = (x) => x instanceof vips.Image ? x.lshift(2) : x << 2;

        // we don't support constant << image, treat as a unary
        run_unary(all_images, lshift, Helpers.noncomplex_formats);
    });

    it('rshift', function () {
        const rshift = (x) => x instanceof vips.Image ? x.rshift(2) : x >> 2;

        // we don't support constant >> image, treat as a unary
        run_unary(all_images, rshift, Helpers.noncomplex_formats);
    });

    it('mod', function () {
        const mod = (x) => x instanceof vips.Image ? x.remainder(2) : x % 2;

        // we don't support constant % image, treat as a unary
        run_unary(all_images, mod, Helpers.noncomplex_formats);
    });

    it('pos', function () {
        const pos = (x) => x instanceof vips.Image ? x : +x;

        run_unary(all_images, pos);
    });

    it('neg', function () {
        const neg = (x) => x instanceof vips.Image ? x.multiply(-1) : -x;

        run_unary(all_images, neg);
    });

    it('invert', function () {
        const invert = (x) => x instanceof vips.Image ? x.invert() : (x ^ -1) & 0xff;

        // ~image is trimmed to image max so it's hard to test for all formats
        // just test uchar
        run_unary(all_images, invert, ['uchar']);
    });

    // test the rest of VipsArithmetic

    it('avg', function () {
        const im = vips.Image.black(50, 100);
        const test = im.insert(im.add(100), 50, 0, {
            expand: true
        });

        for (const fmt of Helpers.all_formats)
            expect(test.cast(fmt).avg()).to.be.closeTo(50, 1e-6);
    });

    it('deviate', function () {
        const im = vips.Image.black(50, 100);
        const test = im.insert(im.add(100), 50, 0, {
            expand: true
        });

        for (const fmt of Helpers.noncomplex_formats)
            expect(test.cast(fmt).deviate()).to.be.closeTo(50, 0.01);
    });

    it('polar', function () {
        let im = vips.Image.black(100, 100).add(100);
        im = im.complexform(im);

        im = im.polar();

        expect(im.real().avg()).to.be.closeTo(100 * 2 ** 0.5, 1e-6);
        expect(im.imag().avg()).to.be.closeTo(45, 1e-6);
    });

    it('rect', function () {
        let im = vips.Image.black(100, 100);
        im = im.add(100 * 2 ** 0.5).complexform(im.add(45));

        im = im.rect();

        expect(im.real().avg()).to.be.closeTo(100, 1e-6);
        expect(im.imag().avg()).to.be.closeTo(100, 1e-6);
    });

    it('conjugate', function () {
        let im = vips.Image.black(100, 100).add(100);
        im = im.complexform(im);

        im = im.conj();

        expect(im.real().avg()).to.be.closeTo(100, 1e-6);
        expect(im.imag().avg()).to.be.closeTo(-100, 1e-6);
    });

    it('histFind', function () {
        const im = vips.Image.black(50, 100);
        let test = im.insert(im.add(10), 50, 0, {
            expand: true
        });

        for (const fmt of Helpers.all_formats) {
            const hist = test.cast(fmt).histFind();
            Helpers.assert_almost_equal_objects(hist.getpoint(0, 0), [5000]);
            Helpers.assert_almost_equal_objects(hist.getpoint(10, 0), [5000]);
            Helpers.assert_almost_equal_objects(hist.getpoint(5, 0), [0]);
        }

        test = test.multiply([1, 2, 3]);

        for (const fmt of Helpers.all_formats) {
            let hist = test.cast(fmt).histFind({
                band: 0
            });
            Helpers.assert_almost_equal_objects(hist.getpoint(0, 0), [5000]);
            Helpers.assert_almost_equal_objects(hist.getpoint(10, 0), [5000]);
            Helpers.assert_almost_equal_objects(hist.getpoint(5, 0), [0]);

            hist = test.cast(fmt).histFind({
                band: 1
            });
            Helpers.assert_almost_equal_objects(hist.getpoint(0, 0), [5000]);
            Helpers.assert_almost_equal_objects(hist.getpoint(20, 0), [5000]);
            Helpers.assert_almost_equal_objects(hist.getpoint(5, 0), [0]);
        }
    });

    it('histFindIndexed', function () {
        const im = vips.Image.black(50, 100);
        const test = im.insert(im.add(10), 50, 0, {
            expand: true
        });
        const index = test.divide(10).floor();

        for (const x of Helpers.noncomplex_formats) {
            for (const y of ['uchar', 'ushort']) {
                const a = test.cast(x);
                const b = index.cast(y);
                const hist = a.histFindIndexed(b);

                Helpers.assert_almost_equal_objects(hist.getpoint(0, 0), [0]);
                Helpers.assert_almost_equal_objects(hist.getpoint(1, 0), [50000]);
            }
        }
    });

    it('histFindNdim', function () {
        const im = vips.Image.black(100, 100).add([1, 2, 3]);

        for (const fmt of Helpers.noncomplex_formats) {
            let hist = im.cast(fmt).histFindNdim();

            Helpers.assert_almost_equal_objects(hist.getpoint(0, 0)[0], 10000);
            Helpers.assert_almost_equal_objects(hist.getpoint(5, 5)[5], 0);

            hist = im.cast(fmt).histFindNdim({
                bins: 1
            });

            Helpers.assert_almost_equal_objects(hist.getpoint(0, 0)[0], 10000);
            expect(hist.width).to.equal(1);
            expect(hist.height).to.equal(1);
            expect(hist.bands).to.equal(1);
        }
    });

    it('houghCircle', function () {
        const test = vips.Image.black(100, 100).copy();
        test.drawCircle(100, 50, 50, 40);

        for (const fmt of Helpers.all_formats) {
            const im = test.cast(fmt);
            const hough = im.houghCircle({
                min_radius: 35,
                max_radius: 45
            });

            const maxPos = {
                x: true,
                y: true,
            };
            const v = hough.max(maxPos);
            const x = maxPos.x;
            const y = maxPos.y;
            const p = hough.getpoint(x, y);
            const r = p.indexOf(v) + 35;

            expect(x).to.be.closeTo(50, 1e-6);
            expect(y).to.be.closeTo(50, 1e-6);
            expect(r).to.be.closeTo(40, 1e-6);
        }
    });

    it('houghLine', function () {
        const test = vips.Image.black(100, 100).copy();
        test.drawLine(100, 10, 90, 90, 10);

        for (const fmt of Helpers.all_formats) {
            const im = test.cast(fmt);
            const hough = im.houghLine();

            const max = hough.maxPos();
            const x = max[0];
            const y = max[1];

            const angle = Math.floor(180.0 * x / hough.width);
            const distance = Math.floor(test.height * y / hough.height);

            expect(angle).to.be.closeTo(45, 1e-6);
            expect(distance).to.be.closeTo(70, 1e-6);
        }
    });

    it('sin', function () {
        const sin = (x) => x instanceof vips.Image ? x.sin() : Math.sin(x * (Math.PI / 180));

        run_unary(all_images, sin, Helpers.noncomplex_formats);
    });

    it('cos', function () {
        const cos = (x) => x instanceof vips.Image ? x.cos() : Math.cos(x * (Math.PI / 180));

        run_unary(all_images, cos, Helpers.noncomplex_formats);
    });

    it('tan', function () {
        const tan = (x) => x instanceof vips.Image ? x.tan() : Math.tan(x * (Math.PI / 180));

        run_unary(all_images, tan, Helpers.noncomplex_formats);
    });

    it('asin', function () {
        const asin = (x) => x instanceof vips.Image ? x.asin() : Math.asin(x) * (180 / Math.PI);

        const im = vips.Image.black(100, 100).add([1, 2, 3]).divide(3.0);
        run_unary([im], asin, Helpers.noncomplex_formats);
    });

    it('acos', function () {
        const acos = (x) => x instanceof vips.Image ? x.acos() : Math.acos(x) * (180 / Math.PI);

        const im = vips.Image.black(100, 100).add([1, 2, 3]).divide(3.0);
        run_unary([im], acos, Helpers.noncomplex_formats);
    });

    it('atan', function () {
        const atan = (x) => x instanceof vips.Image ? x.atan() : Math.atan(x) * (180 / Math.PI);

        const im = vips.Image.black(100, 100).add([1, 2, 3]).divide(3.0);
        run_unary([im], atan, Helpers.noncomplex_formats);
    });

    it('log', function () {
        const log = (x) => x instanceof vips.Image ? x.log() : Math.log(x);

        run_unary(all_images, log, Helpers.noncomplex_formats);
    });

    it('log10', function () {
        const log10 = (x) => x instanceof vips.Image ? x.log10() : Math.log10(x);

        run_unary(all_images, log10, Helpers.noncomplex_formats);
    });

    it('exp', function () {
        const exp = (x) => x instanceof vips.Image ? x.exp() : Math.exp(x);

        run_unary(all_images, exp, Helpers.noncomplex_formats);
    });

    it('exp10', function () {
        const exp10 = (x) => x instanceof vips.Image ? x.exp10() : Math.pow(10, x);

        run_unary(all_images, exp10, Helpers.noncomplex_formats);
    });

    it('floor', function () {
        const floor = (x) => x instanceof vips.Image ? x.floor() : Math.floor(x);

        run_unary(all_images, floor);
    });

    it('ceil', function () {
        const ceil = (x) => x instanceof vips.Image ? x.ceil() : Math.ceil(x);

        run_unary(all_images, ceil);
    });

    it('rint', function () {
        const rint = (x) => x instanceof vips.Image ? x.rint() : Math.round(x);

        run_unary(all_images, rint);
    });

    it('sign', function () {
        const sign = (x) => x instanceof vips.Image ? x.sign() : x > 0 ? 1 : x < 0 ? -1 : 0;

        run_unary(all_images, sign);
    });

    it('max', function () {
        const test = vips.Image.black(100, 100).copy();
        test.drawRect(100, 40, 50, 1, 1);

        for (const fmt of Helpers.all_formats) {
            const maxPos = {
                x: true,
                y: true,
            };
            const v = test.cast(fmt).max(maxPos);
            const x = maxPos.x;
            const y = maxPos.y;

            expect(v).to.be.closeTo(100, 1e-6);
            expect(x).to.be.closeTo(40, 1e-6);
            expect(y).to.be.closeTo(50, 1e-6);
        }
    });

    it('min', function () {
        const test = vips.Image.black(100, 100).add(100).copy();
        test.drawRect(0, 40, 50, 1, 1);

        for (const fmt of Helpers.all_formats) {
            const minPos = {
                x: true,
                y: true,
            };
            const v = test.cast(fmt).min(minPos);
            const x = minPos.x;
            const y = minPos.y;

            expect(v).to.be.closeTo(0, 1e-6);
            expect(x).to.be.closeTo(40, 1e-6);
            expect(y).to.be.closeTo(50, 1e-6);
        }
    });

    it('measure', function () {
        const im = vips.Image.black(50, 50);
        const test = im.insert(im.add(10), 50, 0, {
            expand: true
        });

        for (const fmt of Helpers.noncomplex_formats) {
            const a = test.cast(fmt);
            const matrix = a.measure(2, 1);
            const p1 = matrix.getpoint(0, 0)[0];
            const p2 = matrix.getpoint(0, 1)[0];

            expect(p1).to.be.closeTo(0, 1e-6);
            expect(p2).to.be.closeTo(10, 1e-6);
        }
    });

    it('findTrim', function () {
        const im = vips.Image.black(50, 60).add(100);
        const test = im.embed(10, 20, 200, 300, {
            extend: 'white'
        });

        for (const x of Helpers.unsigned_formats.concat(Helpers.float_formats)) {
            const a = test.cast(x);
            const trim = a.findTrim();

            expect(trim.left).to.equal(10);
            expect(trim.top).to.equal(20);
            expect(trim.width).to.equal(50);
            expect(trim.height).to.equal(60);
        }

        const test_rgb = test.bandjoin([test, test]);
        const trim = test_rgb.findTrim({
            background: [255, 255, 255]
        });

        expect(trim.left).to.equal(10);
        expect(trim.top).to.equal(20);
        expect(trim.width).to.equal(50);
        expect(trim.height).to.equal(60);
    });

    it('profile', function () {
        const test = vips.Image.black(100, 100).copy();
        test.drawRect(100, 40, 50, 1, 1);

        for (const fmt of Helpers.noncomplex_formats) {
            const profile = test.cast(fmt).profile();
            const columns = profile.columns;
            const rows = profile.rows;

            let minPos = {
                x: true,
                y: true,
            };
            let v = columns.min(minPos);
            let x = minPos.x;
            let y = minPos.y;
            expect(v).to.be.closeTo(50, 1e-6);
            expect(x).to.be.closeTo(40, 1e-6);
            expect(y).to.be.closeTo(0, 1e-6);

            minPos = {
                x: true,
                y: true,
            };
            v = rows.min(minPos);
            x = minPos.x;
            y = minPos.y;
            expect(v).to.be.closeTo(40, 1e-6);
            expect(x).to.be.closeTo(0, 1e-6);
            expect(y).to.be.closeTo(50, 1e-6);
        }
    });

    it('project', function () {
        const im = vips.Image.black(50, 50);
        const test = im.insert(im.add(10), 50, 0, {
            expand: true
        });

        for (const x of Helpers.noncomplex_formats) {
            const a = test.cast(x);
            const matrix = a.stats();

            Helpers.assert_almost_equal_objects(matrix.getpoint(0, 0), [a.min()]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(1, 0), [a.max()]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(2, 0), [50 * 50 * 10]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(3, 0), [50 * 50 * 100]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(4, 0), [a.avg()]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(5, 0), [a.deviate()]);

            Helpers.assert_almost_equal_objects(matrix.getpoint(0, 1), [a.min()]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(1, 1), [a.max()]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(2, 1), [50 * 50 * 10]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(3, 1), [50 * 50 * 100]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(4, 1), [a.avg()]);
            Helpers.assert_almost_equal_objects(matrix.getpoint(5, 1), [a.deviate()]);
        }
    });

    it('sum', function () {
        for (const fmt of Helpers.all_formats) {
            const im = vips.Image.black(50, 50);
            let sum = 0;
            const im2 = Array(10).fill(0).map((v, i) => {
                const add = (i + 1) * 10;
                sum += add;
                return im.add(add).cast(fmt);
            });
            const im3 = vips.Image.sum(im2);

            expect(im3.max()).to.be.closeTo(sum, 1e-6);
        }
    });
});
