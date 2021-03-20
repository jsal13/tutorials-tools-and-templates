class SampleClass:
    """ Sample Class """

    def __init__(self, a, b):
        self.a = a
        self.b = b

    def add_things(self):
        return self.a + self.b

    def times_a(self, x):
        return x * self.a


def mock_add_things(self, *args, **kwargs):
    # Notice we're using "self" as the first var here, since it expects it in the class.

    return 12345


def mock_times_a(self, x, *args, **kwargs):
    if x > 0:
        return 1000
    return -1000


def test_1(mocker):
    mocker.patch.object(SampleClass, "add_things", mock_add_things)
    sc = SampleClass(a=1, b=2)
    assert sc.add_things() == 12345


def test_2(mocker):
    mocker.patch.object(SampleClass, "times_a", mock_times_a)
    sc = SampleClass(a=1, b=2)
    assert sc.times_a(23) == 1000
    assert sc.times_a(-23) == -1000
