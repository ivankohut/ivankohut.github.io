---
layout: post
author: ivankohut
---

There are lot of good practices and patterns to use when writing unit tests. I am not going to discuss them. Every team has to, however, agree on 
* the style of writing the unit tests so that it is consistent throughout the project code base
* the libraries and frameworks to use and not to use

This post describes conventions I propose/use in Java software projects in 2019 being developed by the team I am member of. 

The first part describes conventions applicable for any programming language. Second part lists Java 8+ specific frameworks and libraries applicable mainly 
for new/refactored code - legacy code imposes constraints which require additional (otherwise not permitted) tools to be used, e.g. _PowerMock_.

## Language neutral conventions
1. Test phases marks - mark the _exercise_ and _verify_ phases (_setup_ phase is the first and therefore does not need any mark, 
_teardown_ is usually not needed in garbage collected languages) of the unit test (see [Four-Phase Test](http://xunitpatterns.com/Four%20Phase%20Test.html)) 
using `exercise` and `verify` comments,  no `act` and `assert` from _arrange-act-assert_ group, no `when` and `then` from _given-when-then_ group. I do not recommend using empty line as separator since it is ambiguous:
  * it is not clear what phase of unit test follows the empty line
  * empty line is sometimes used to separate groups of relates statements in too long methods (I do not recommend long methods of course and such use of [empty lines is code smell](https://www.yegor256.com/2014/11/03/empty-line-code-smell.html))

1. Naming
  * test method name - _Feature to be tested_, see point 4. in [7 Popular Unit Test Naming Conventions](https://dzone.com/articles/7-popular-unit-test-naming) 
  * `sut` for _System under Test_, see [SUT](http://xunitpatterns.com/SUT.html)
  * `result` for the result object we want to verify
1. No data sharing between tests (using same values in different unit tests is not duplication per se)
  * no `sut` nor mocks shared between different unit tests
  * no common setup nor common teardown - use factory methods instead, see [Do setup/teardown hurt test maintainability?](https://stackoverflow.com/questions/1087317/do-setup-teardown-hurt-test-maintainability)

Example of language neutral conventions:
```java
// Java
    @Test
    void sumOfGivenBaseAndAdditionalAmount() {
        var sut = new Number(7);
        // exercise
        var result = sut.sum(5);
        // verify
        assertThat(result).isEqualTo(12);
    }
```
```python
# Python
    def test_sumOfGivenBaseAndAdditionalAmount(self):
        sut = Number(7);
        # exercise
        result = sut.sum(5);
        # verify
        self.assertEqual(12, result);
```

## Java specific conventions (frameworks and libraries)
* testing framework - [JUnit 5](https://junit.org/junit5/) (because of builtin support for parametrized tests (`@ParametrizedTest`), package private test methods and classes
* assertions library - [AssertJ](https://joel-costigliola.github.io/assertj/)
  - `assertThatThrownBy` instead of `assertThatExceptionOfType`
* mocking library - [mockito](https://site.mockito.org/)
* no _PowerMock_, see [Why not PowerMock](https://stackoverflow.com/a/30163045)
- test method specific mock instances (created with `org.mockito.Mockito#mock` method),  no `@Mock`, `@InjectMocks` etc.

Remember this post is about unit tests - tools such as _WireMock_, _HSQLDB_, _SoapUI_ or _FitNesse_ are out of the scope since they are used for different kinds of automated tests.



